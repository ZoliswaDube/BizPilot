import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Vibration,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import {
  X,
  Flashlight,
  RotateCcw,
  Package,
  Plus,
  Edit3,
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import * as Haptics from 'expo-haptics';

interface ScannedProduct {
  id?: string;
  barcode: string;
  name?: string;
  current_quantity?: number;
  cost_per_unit?: number;
  selling_price?: number;
  unit?: string;
  exists: boolean;
}

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onProductScanned: (product: ScannedProduct) => void;
  mode: 'inventory' | 'sales' | 'lookup';
}

interface ProductFormData {
  name: string;
  current_quantity: string;
  cost_per_unit: string;
  selling_price: string;
  unit: string;
  description: string;
  supplier: string;
  location: string;
}

export default function BarcodeScanner({
  visible,
  onClose,
  onProductScanned,
  mode
}: BarcodeScannerProps) {
  const { user, business } = useAuthStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashlight, setFlashlight] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    current_quantity: '0',
    cost_per_unit: '0',
    selling_price: '0',
    unit: 'unit',
    description: '',
    supplier: '',
    location: '',
  });

  useEffect(() => {
    getCameraPermissions();
  }, []);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setScannedProduct(null);
      setShowProductForm(false);
    }
  }, [visible]);

  const getCameraPermissions = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    Vibration.vibrate();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      setLoading(true);
      await lookupProduct(data);
    } catch (error) {
      console.error('Error handling barcode scan:', error);
      Alert.alert('Error', 'Failed to process barcode scan');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const lookupProduct = async (barcode: string) => {
    try {
      // First check if product exists in our inventory
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            p.id,
            p.name,
            p.selling_price,
            i.current_quantity,
            i.cost_per_unit,
            i.unit
          FROM products p
          LEFT JOIN inventory i ON p.id = i.product_id
          WHERE p.barcode = $1 AND p.business_id = $2
        `,
        params: [barcode, business?.id]
      });

      if (result.success && result.data?.length > 0) {
        // Product exists in our database
        const product = result.data[0];
        const scannedProduct: ScannedProduct = {
          id: product.id,
          barcode,
          name: product.name,
          current_quantity: product.current_quantity || 0,
          cost_per_unit: product.cost_per_unit || 0,
          selling_price: product.selling_price || 0,
          unit: product.unit || 'unit',
          exists: true,
        };
        
        setScannedProduct(scannedProduct);
        handleProductFound(scannedProduct);
      } else {
        // Product doesn't exist, try to lookup from external API (if available)
        const externalProduct = await lookupExternalProduct(barcode);
        
        if (externalProduct) {
          setScannedProduct(externalProduct);
          setProductForm(prev => ({
            ...prev,
            name: externalProduct.name || '',
          }));
          setShowProductForm(true);
        } else {
          // No external data, show form for manual entry
          setScannedProduct({
            barcode,
            exists: false,
          });
          setShowProductForm(true);
        }
      }
    } catch (error) {
      console.error('Error looking up product:', error);
      Alert.alert('Error', 'Failed to lookup product information');
    }
  };

  const lookupExternalProduct = async (barcode: string): Promise<ScannedProduct | null> => {
    try {
      // Mock external API lookup - in real app would call UPC database API
      const mockProducts: { [key: string]: Partial<ScannedProduct> } = {
        '123456789012': {
          name: 'Sample Product A',
          unit: 'unit',
        },
        '987654321098': {
          name: 'Sample Product B',
          unit: 'kg',
        },
      };

      const mockProduct = mockProducts[barcode];
      if (mockProduct) {
        return {
          barcode,
          name: mockProduct.name,
          unit: mockProduct.unit || 'unit',
          exists: false,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error looking up external product:', error);
      return null;
    }
  };

  const handleProductFound = (product: ScannedProduct) => {
    switch (mode) {
      case 'inventory':
        showInventoryOptions(product);
        break;
      case 'sales':
        showSalesOptions(product);
        break;
      case 'lookup':
        onProductScanned(product);
        onClose();
        break;
    }
  };

  const showInventoryOptions = (product: ScannedProduct) => {
    Alert.alert(
      'Product Found',
      `${product.name}\nCurrent Stock: ${product.current_quantity} ${product.unit}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
        {
          text: 'Quick Add Stock',
          onPress: () => showQuickStockAdjustment(product)
        },
        {
          text: 'View Details',
          onPress: () => {
            onProductScanned(product);
            onClose();
          }
        }
      ]
    );
  };

  const showSalesOptions = (product: ScannedProduct) => {
    Alert.alert(
      'Add to Order',
      `${product.name}\nPrice: $${product.selling_price?.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
        {
          text: 'Add to Cart',
          onPress: () => {
            onProductScanned(product);
            onClose();
          }
        }
      ]
    );
  };

  const showQuickStockAdjustment = (product: ScannedProduct) => {
    Alert.prompt(
      'Stock Adjustment',
      `Add stock for ${product.name}:`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
        {
          text: 'Add',
          onPress: async (quantity) => {
            if (quantity && !isNaN(parseFloat(quantity))) {
              await updateProductStock(product, parseFloat(quantity));
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const updateProductStock = async (product: ScannedProduct, quantityToAdd: number) => {
    try {
      setLoading(true);
      
      const newQuantity = (product.current_quantity || 0) + quantityToAdd;
      
      await mcp_supabase_execute_sql({
        query: `
          UPDATE inventory 
          SET current_quantity = $1, updated_at = $2
          WHERE product_id = $3 AND business_id = $4
        `,
        params: [newQuantity, new Date().toISOString(), product.id, business?.id]
      });

      // Record transaction
      await mcp_supabase_execute_sql({
        query: `
          INSERT INTO inventory_transactions (
            business_id, user_id, inventory_id, type, quantity_change, 
            new_quantity, transaction_date, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        params: [
          business?.id,
          user?.id,
          product.id, // Would need actual inventory_id
          'add',
          quantityToAdd,
          newQuantity,
          new Date().toISOString(),
          'Barcode scan stock adjustment'
        ]
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Added ${quantityToAdd} ${product.unit} to ${product.name}`);
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      Alert.alert('Error', 'Failed to update stock');
    } finally {
      setLoading(false);
      setScanned(false);
    }
  };

  const createNewProduct = async () => {
    if (!productForm.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }

    try {
      setLoading(true);

      // Create product
      const productResult = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO products (
            business_id, user_id, name, selling_price, barcode, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        params: [
          business?.id,
          user?.id,
          productForm.name,
          parseFloat(productForm.selling_price) || 0,
          scannedProduct?.barcode,
          new Date().toISOString()
        ]
      });

      if (productResult.success && productResult.data?.[0]?.id) {
        const productId = productResult.data[0].id;

        // Create inventory entry
        await mcp_supabase_execute_sql({
          query: `
            INSERT INTO inventory (
              business_id, user_id, product_id, name, current_quantity, 
              unit, cost_per_unit, description, supplier, location, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `,
          params: [
            business?.id,
            user?.id,
            productId,
            productForm.name,
            parseFloat(productForm.current_quantity) || 0,
            productForm.unit,
            parseFloat(productForm.cost_per_unit) || 0,
            productForm.description,
            productForm.supplier,
            productForm.location,
            new Date().toISOString()
          ]
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Product created successfully');
        
        const newProduct: ScannedProduct = {
          id: productId,
          barcode: scannedProduct?.barcode || '',
          name: productForm.name,
          current_quantity: parseFloat(productForm.current_quantity) || 0,
          cost_per_unit: parseFloat(productForm.cost_per_unit) || 0,
          selling_price: parseFloat(productForm.selling_price) || 0,
          unit: productForm.unit,
          exists: true,
        };
        
        onProductScanned(newProduct);
        onClose();
      }
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScannedProduct(null);
    setShowProductForm(false);
  };

  if (hasPermission === null) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required to scan barcodes
          </Text>
          <Button
            title="Grant Permission"
            onPress={getCameraPermissions}
            style={styles.permissionButton}
          />
          <Button
            title="Close"
            onPress={onClose}
            variant="ghost"
            style={styles.permissionButton}
          />
        </View>
      </Modal>
    );
  }

  const renderProductForm = () => (
    <Modal
      visible={showProductForm}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowProductForm(false)}
    >
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setShowProductForm(false)}>
            <X size={24} color="#a78bfa" />
          </TouchableOpacity>
          <Text style={styles.formTitle}>Add New Product</Text>
          <TouchableOpacity onPress={createNewProduct} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.disabledButton]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContent}>
          <Card style={styles.barcodeInfo}>
            <Text style={styles.barcodeLabel}>Scanned Barcode</Text>
            <Text style={styles.barcodeValue}>{scannedProduct?.barcode}</Text>
          </Card>

          <Input
            value={productForm.name}
            onChangeText={(value) => setProductForm(prev => ({ ...prev, name: value }))}
            placeholder="Product Name *"
            style={styles.formInput}
          />

          <View style={styles.formRow}>
            <Input
              value={productForm.current_quantity}
              onChangeText={(value) => setProductForm(prev => ({ ...prev, current_quantity: value }))}
              placeholder="Initial Quantity"
              keyboardType="decimal-pad"
              style={[styles.formInput, styles.halfInput]}
            />
            <Input
              value={productForm.unit}
              onChangeText={(value) => setProductForm(prev => ({ ...prev, unit: value }))}
              placeholder="Unit (e.g., unit, kg, L)"
              style={[styles.formInput, styles.halfInput]}
            />
          </View>

          <View style={styles.formRow}>
            <Input
              value={productForm.cost_per_unit}
              onChangeText={(value) => setProductForm(prev => ({ ...prev, cost_per_unit: value }))}
              placeholder="Cost per Unit"
              keyboardType="decimal-pad"
              style={[styles.formInput, styles.halfInput]}
            />
            <Input
              value={productForm.selling_price}
              onChangeText={(value) => setProductForm(prev => ({ ...prev, selling_price: value }))}
              placeholder="Selling Price"
              keyboardType="decimal-pad"
              style={[styles.formInput, styles.halfInput]}
            />
          </View>

          <Input
            value={productForm.supplier}
            onChangeText={(value) => setProductForm(prev => ({ ...prev, supplier: value }))}
            placeholder="Supplier (optional)"
            style={styles.formInput}
          />

          <Input
            value={productForm.location}
            onChangeText={(value) => setProductForm(prev => ({ ...prev, location: value }))}
            placeholder="Storage Location (optional)"
            style={styles.formInput}
          />

          <Input
            value={productForm.description}
            onChangeText={(value) => setProductForm(prev => ({ ...prev, description: value }))}
            placeholder="Description (optional)"
            multiline
            numberOfLines={3}
            style={styles.formInput}
          />
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {mode === 'inventory' ? 'Inventory Scan' : 
             mode === 'sales' ? 'Sales Scan' : 'Product Lookup'}
          </Text>
          
          <TouchableOpacity 
            onPress={() => setFlashlight(!flashlight)}
            style={styles.flashButton}
          >
            <Flashlight size={24} color={flashlight ? "#f59e0b" : "#ffffff"} />
          </TouchableOpacity>
        </View>

        {/* Scanner View */}
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.scanner}
            flashMode={flashlight ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
          />
          
          {/* Scan Overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={styles.scanCorner} />
              <View style={[styles.scanCorner, styles.topRight]} />
              <View style={[styles.scanCorner, styles.bottomLeft]} />
              <View style={[styles.scanCorner, styles.bottomRight]} />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Package size={32} color="#ffffff" />
            <Text style={styles.instructionText}>
              {scanned 
                ? loading ? 'Processing...' : 'Barcode scanned!'
                : 'Position barcode within the frame'
              }
            </Text>
            {!scanned && (
              <Text style={styles.instructionSubtext}>
                Make sure the barcode is clearly visible and well-lit
              </Text>
            )}
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          {scanned && (
            <Button
              title="Scan Again"
              onPress={resetScanner}
              style={styles.controlButton}
              leftIcon={<RotateCcw size={16} color="#ffffff" />}
            />
          )}
        </View>

        {/* Product Form Modal */}
        {renderProductForm()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  flashButton: {
    padding: 8,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#a78bfa',
    borderWidth: 3,
    borderTopLeftRadius: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: undefined,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    top: undefined,
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: undefined,
    left: undefined,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 12,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  controls: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    backgroundColor: '#a78bfa',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
    paddingHorizontal: 40,
  },
  permissionText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    marginTop: 16,
    minWidth: 200,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
  },
  disabledButton: {
    color: '#6b7280',
  },
  formContent: {
    flex: 1,
    padding: 20,
  },
  barcodeInfo: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#1e293b',
  },
  barcodeLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  barcodeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a78bfa',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  formInput: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
}); 