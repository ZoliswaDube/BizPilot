import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  Modal,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  DollarSign,
  BarChart3,
  Camera,
  X,
} from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { theme } from '../../src/styles/theme';
import { mcp_supabase_execute_sql } from '../../src/services/mcpClient';
import { useAuthStore } from '../../src/store/auth';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  cost?: number;
  profit_margin?: number;
  min_stock_level?: number;
  category_name?: string;
  supplier_name?: string;
  image_url?: string;
  barcode?: string;
  description?: string;
  is_active?: boolean;
  stock_quantity?: number;
}

export default function ProductsScreen() {
  const { business, user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    if (!business?.id) return;

    try {
      setLoading(true);
      
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            p.id,
            p.name,
            p.sku,
            p.price,
            p.cost,
            p.min_stock_level,
            p.barcode,
            p.description,
            p.image_url,
            p.is_active,
            p.created_at,
            c.name as category_name,
            s.name as supplier_name,
            COALESCE(i.current_quantity, 0) as stock_quantity,
            CASE 
              WHEN p.cost > 0 AND p.price > 0 
              THEN ((p.price - p.cost) / p.price * 100) 
              ELSE 0 
            END as profit_margin
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN suppliers s ON p.supplier_id = s.id
          LEFT JOIN inventory i ON p.id = i.product_id
          WHERE p.business_id = $1
          ORDER BY p.created_at DESC
        `,
        params: [business.id]
      });

      if (result.success) {
        setProducts(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await fetchProducts();
    setRefreshing(false);
  };

  const handleCreateProduct = async (productData: {
    name: string;
    sku?: string;
    price: number;
    cost?: number;
    min_stock_level?: number;
    description?: string;
    image_url?: string;
    barcode?: string;
  }) => {
    if (!business?.id || !user?.id) {
      Alert.alert('Error', 'Missing business or user information');
      return;
    }

    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO products (
            business_id, name, sku, price, cost, min_stock_level, 
            description, image_url, barcode, is_active, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
          RETURNING id
        `,
        params: [
          business.id,
          productData.name,
          productData.sku || null,
          productData.price,
          productData.cost || null,
          productData.min_stock_level || null,
          productData.description || null,
          productData.image_url || null,
          productData.barcode || null,
          user.id
        ]
      });

      if (result.success) {
        Alert.alert('Success', 'Product created successfully');
        setShowCreateModal(false);
        await fetchProducts(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to create product. Please try again.');
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await mcp_supabase_execute_sql({
                query: 'UPDATE products SET is_active = false WHERE id = $1 AND business_id = $2',
                params: [productId, business?.id]
              });

              if (result.success) {
                Alert.alert('Success', 'Product deleted successfully');
                await fetchProducts();
              } else {
                throw new Error('Failed to delete product');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderProductCard = (product: Product) => (
    <Card key={product.id} style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productImage}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} />
          ) : (
            <Package size={32} color={theme.colors.primary[500]} />
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productSku}>SKU: {product.sku}</Text>
          {product.category_name && (
            <Text style={styles.productCategory}>{product.category_name}</Text>
          )}
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Edit size={16} color={theme.colors.primary[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteProduct(product.id, product.name)}
          >
            <Trash2 size={16} color={theme.colors.red[500]} />
          </TouchableOpacity>
        </View>
      </View>

              <View style={styles.productMetrics}>
          <View style={styles.metricItem}>
            <DollarSign size={16} color={theme.colors.green[500]} />
            <Text style={styles.metricValue}>${product.price?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.metricLabel}>Price</Text>
          </View>
          <View style={styles.metricItem}>
            <BarChart3 size={16} color={theme.colors.primary[500]} />
            <Text style={styles.metricValue}>{product.profit_margin?.toFixed(1) || '0.0'}%</Text>
            <Text style={styles.metricLabel}>Margin</Text>
          </View>
          <View style={styles.metricItem}>
            <Package size={16} color={theme.colors.yellow[500]} />
            <Text style={styles.metricValue}>{product.stock_quantity || 0}</Text>
            <Text style={styles.metricLabel}>Stock</Text>
          </View>
        </View>

      {product.description && (
        <Text style={styles.productDescription}>{product.description}</Text>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={theme.colors.gray[400]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={theme.colors.gray[400]}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={theme.colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              ${products.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {(products.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / Math.max(products.length, 1)).toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>Avg Margin</Text>
          </View>
        </View>
      </Card>

      {/* Products List */}
      <ScrollView
        style={styles.productsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredProducts.map(renderProductCard)}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {filteredProducts.length} of {products.length} products
          </Text>
        </View>
      </ScrollView>

      {/* Create Product Modal */}
      <CreateProductModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateProduct}
      />
    </SafeAreaView>
  );
}

// Create Product Modal Component
const CreateProductModal = ({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('');
  const [description, setDescription] = useState('');
  const [barcode, setBarcode] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !price) {
      Alert.alert('Error', 'Please fill in required fields (name and price)');
      return;
    }

    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        sku: sku.trim() || undefined,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : undefined,
        min_stock_level: minStockLevel ? parseInt(minStockLevel) : undefined,
        description: description.trim() || undefined,
        barcode: barcode.trim() || undefined,
        image_url: imageUri || undefined,
      });

      // Reset form
      setName('');
      setSku('');
      setPrice('');
      setCost('');
      setMinStockLevel('');
      setDescription('');
      setBarcode('');
      setImageUri(null);
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Product</Text>
          <TouchableOpacity onPress={handleCreate} disabled={loading}>
            <Text style={[styles.modalSaveButton, loading && { opacity: 0.5 }]}>
              {loading ? 'Creating...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            label="Product Name *"
            value={name}
            onChangeText={setName}
            placeholder="Enter product name"
          />
          
          <Input
            label="SKU *"
            value={sku}
            onChangeText={setSku}
            placeholder="Enter SKU"
            style={styles.modalInput}
          />
          
          <Input
            label="Selling Price *"
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="decimal-pad"
            style={styles.modalInput}
          />
          
          <Input
            label="Cost"
            value={cost}
            onChangeText={setCost}
            placeholder="0.00"
            keyboardType="decimal-pad"
            style={styles.modalInput}
          />

          <Input
            label="Barcode"
            value={barcode}
            onChangeText={setBarcode}
            placeholder="Product barcode"
            style={styles.modalInput}
          />
          
          <Input
            label="Minimum Stock Level"
            value={minStockLevel}
            onChangeText={setMinStockLevel}
            placeholder="0"
            keyboardType="numeric"
            style={styles.modalInput}
          />
          
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Product description"
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />

          {/* Image Section */}
          <View style={styles.imageSection}>
            <Text style={styles.inputLabel}>Product Image</Text>
            
            {imageUri ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(null)}
                >
                  <X size={16} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imageButton} onPress={handleTakePhoto}>
                <Camera size={24} color={theme.colors.primary[500]} />
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  addButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    paddingVertical: theme.spacing.sm,
  },
  filterButton: {
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.xs,
  },
  productsList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  productCard: {
    marginBottom: theme.spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  productImage: {
    width: 60,
    height: 60,
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  productSku: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginBottom: theme.spacing.xs,
  },
  productCategory: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[400],
  },
  productActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.sm,
  },
  productMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[700],
    marginBottom: theme.spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },
  metricLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.xs,
  },
  productDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[300],
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark[800],
  },
  modalCancelButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  modalSaveButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary[500],
    fontWeight: theme.fontWeight.semibold,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  modalInput: {
    marginTop: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[300],
    marginBottom: theme.spacing.sm,
  },
  imageSection: {
    marginTop: theme.spacing.md,
  },
  imageButton: {
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.dark[600],
    borderStyle: 'dashed',
  },
  imageButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary[500],
    marginTop: theme.spacing.sm,
  },
  imagePreview: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.red[500],
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.xs,
  },
}); 