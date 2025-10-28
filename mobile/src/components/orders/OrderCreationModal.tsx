import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import {
  X,
  Plus,
  Minus,
  User,
  Package,
  DollarSign,
  Search,
  ShoppingCart,
  Calculator,
  CheckCircle,
  Trash2,
  Users,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import * as Haptics from 'expo-haptics';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  sku: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export default function OrderCreationModal({
  visible,
  onClose,
  onOrderCreated,
}: OrderCreationModalProps) {
  const { user, business } = useAuthStore();
  const [step, setStep] = useState<'customer' | 'items' | 'review'>('customer');
  const [loading, setLoading] = useState(false);
  
  // Customer Selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Product Selection
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  
  // Order Details
  const [orderNotes, setOrderNotes] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0.1); // 10% default
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (visible) {
      loadCustomers();
      loadProducts();
      loadBusinessSettings();
    }
  }, [visible]);

  useEffect(() => {
    calculateTotals();
  }, [orderItems, taxRate]);

  const loadCustomers = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT id, name, email, phone 
          FROM customers 
          WHERE business_id = $1 
          ORDER BY name ASC
        `,
        params: [business?.id]
      });

      if (result.success) {
        setCustomers(result.data || []);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT id, name, price, stock_quantity, sku 
          FROM products 
          WHERE business_id = $1 AND is_active = true
          ORDER BY name ASC
        `,
        params: [business?.id]
      });

      if (result.success) {
        setProducts(result.data || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadBusinessSettings = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT tax_rate 
          FROM business_settings 
          WHERE business_id = $1
        `,
        params: [business?.id]
      });

      if (result.success && result.data?.[0]) {
        setTaxRate(result.data[0].tax_rate || 0.1);
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
    }
  };

  const calculateTotals = () => {
    const newSubtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const newTaxAmount = newSubtotal * taxRate;
    const newTotal = newSubtotal + newTaxAmount;
    
    setSubtotal(newSubtotal);
    setTaxAmount(newTaxAmount);
    setTotalAmount(newTotal);
  };

  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      updateItemQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        id: `temp_${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
      };
      setOrderItems([...orderItems, newItem]);
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromOrder(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity > product.stock_quantity) {
      Alert.alert(
        'Insufficient Stock',
        `Only ${product.stock_quantity} units available for ${product.name}`
      );
      return;
    }

    setOrderItems(items => 
      items.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
          : item
      )
    );
  };

  const removeItemFromOrder = (productId: string) => {
    setOrderItems(items => items.filter(item => item.product_id !== productId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const createOrder = async () => {
    if (!selectedCustomer || orderItems.length === 0 || !user || !business) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    setLoading(true);
    
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      
      // Create the order
      const orderResult = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO orders (
            order_number, customer_id, business_id, subtotal, tax_amount, 
            total_amount, status, notes, created_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `,
        params: [
          orderNumber,
          selectedCustomer.id,
          business.id,
          subtotal,
          taxAmount,
          totalAmount,
          'pending',
          orderNotes,
          user.id,
          new Date().toISOString()
        ]
      });

      if (!orderResult.success || !orderResult.data?.[0]?.id) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResult.data[0].id;

      // Create order items
      for (const item of orderItems) {
        await mcp_supabase_execute_sql({
          query: `
            INSERT INTO order_items (
              order_id, product_id, quantity, unit_price, total_price
            ) VALUES ($1, $2, $3, $4, $5)
          `,
          params: [
            orderId,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.total_price
          ]
        });

        // Update product inventory
        await mcp_supabase_execute_sql({
          query: `
            UPDATE products 
            SET stock_quantity = stock_quantity - $1,
                updated_at = $2
            WHERE id = $3
          `,
          params: [
            item.quantity,
            new Date().toISOString(),
            item.product_id
          ]
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Order created successfully!');
      
      // Reset form and close modal
      resetForm();
      onOrderCreated();
      onClose();

    } catch (error) {
      console.error('Error creating order:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('customer');
    setSelectedCustomer(null);
    setOrderItems([]);
    setOrderNotes('');
    setCustomerSearch('');
    setProductSearch('');
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const renderCustomerStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Customer</Text>
      
      <Input
        value={customerSearch}
        onChangeText={setCustomerSearch}
        placeholder="Search customers..."
        leftIcon={<Search size={20} color="#9ca3af" />}
        style={styles.searchInput}
      />

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.customerItem,
              selectedCustomer?.id === item.id && styles.selectedCustomerItem
            ]}
            onPress={() => setSelectedCustomer(item)}
          >
            <View style={styles.customerIcon}>
              <User size={20} color="#a78bfa" />
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.name}</Text>
              {item.email && <Text style={styles.customerEmail}>{item.email}</Text>}
              {item.phone && <Text style={styles.customerPhone}>{item.phone}</Text>}
            </View>
            {selectedCustomer?.id === item.id && (
              <CheckCircle size={20} color="#22c55e" />
            )}
          </TouchableOpacity>
        )}
      />

      <Button
        title="Continue to Items"
        onPress={() => setStep('items')}
        disabled={!selectedCustomer}
        style={styles.stepButton}
      />
    </View>
  );

  const renderItemsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Add Items</Text>
      
      <Input
        value={productSearch}
        onChangeText={setProductSearch}
        placeholder="Search products..."
        leftIcon={<Search size={20} color="#9ca3af" />}
        style={styles.searchInput}
      />

      <ScrollView style={styles.productsSection}>
        <Text style={styles.sectionLabel}>Available Products</Text>
        {filteredProducts.map(product => (
          <TouchableOpacity
            key={product.id}
            style={styles.productItem}
            onPress={() => addProductToOrder(product)}
          >
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDetails}>
                ${product.price.toFixed(2)} • Stock: {product.stock_quantity}
              </Text>
            </View>
            <Plus size={20} color="#a78bfa" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {orderItems.length > 0 && (
        <View style={styles.orderItemsSection}>
          <Text style={styles.sectionLabel}>Order Items</Text>
          {orderItems.map(item => (
            <Card key={item.id} style={styles.orderItemCard}>
              <View style={styles.orderItemHeader}>
                <Text style={styles.orderItemName}>{item.product_name}</Text>
                <TouchableOpacity
                  onPress={() => removeItemFromOrder(item.product_id)}
                  style={styles.removeButton}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <View style={styles.orderItemControls}>
                <TouchableOpacity
                  onPress={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                  style={styles.quantityButton}
                >
                  <Minus size={16} color="#a78bfa" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                  style={styles.quantityButton}
                >
                  <Plus size={16} color="#a78bfa" />
                </TouchableOpacity>
                <Text style={styles.itemTotal}>
                  ${item.total_price.toFixed(2)}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.stepButtons}>
        <Button
          title="Back"
          onPress={() => setStep('customer')}
          variant="ghost"
          style={styles.backButton}
        />
        <Button
          title="Review Order"
          onPress={() => setStep('review')}
          disabled={orderItems.length === 0}
          style={styles.continueButton}
        />
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review Order</Text>
      
      <Card style={styles.reviewCard}>
        <View style={styles.customerSummary}>
          <Users size={20} color="#a78bfa" />
          <View style={styles.customerSummaryText}>
            <Text style={styles.customerSummaryName}>{selectedCustomer?.name}</Text>
            <Text style={styles.customerSummaryEmail}>{selectedCustomer?.email}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.reviewCard}>
        <Text style={styles.reviewSectionTitle}>Order Items</Text>
        {orderItems.map(item => (
          <View key={item.id} style={styles.reviewItem}>
            <Text style={styles.reviewItemName}>{item.product_name}</Text>
            <Text style={styles.reviewItemDetails}>
              {item.quantity} × ${item.unit_price.toFixed(2)} = ${item.total_price.toFixed(2)}
            </Text>
          </View>
        ))}
      </Card>

      <Card style={styles.reviewCard}>
        <Text style={styles.reviewSectionTitle}>Order Total</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({(taxRate * 100).toFixed(1)}%):</Text>
          <Text style={styles.totalValue}>${taxAmount.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total:</Text>
          <Text style={styles.grandTotalValue}>${totalAmount.toFixed(2)}</Text>
        </View>
      </Card>

      <Input
        value={orderNotes}
        onChangeText={setOrderNotes}
        placeholder="Order notes (optional)"
        multiline
        numberOfLines={3}
        style={styles.notesInput}
      />

      <View style={styles.stepButtons}>
        <Button
          title="Back"
          onPress={() => setStep('items')}
          variant="ghost"
          style={styles.backButton}
        />
        <Button
          title="Create Order"
          onPress={createOrder}
          loading={loading}
          style={styles.createButton}
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#a78bfa" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Order</Text>
          <View style={styles.placeholder} />
        </View>

        {step === 'customer' && renderCustomerStep()}
        {step === 'items' && renderItemsStep()}
        {step === 'review' && renderReviewStep()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  searchInput: {
    marginBottom: 16,
  },
  list: {
    flex: 1,
    marginBottom: 20,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCustomerItem: {
    borderColor: '#a78bfa',
    backgroundColor: '#a78bfa20',
  },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 14,
    color: '#9ca3af',
  },
  customerPhone: {
    fontSize: 14,
    color: '#9ca3af',
  },
  stepButton: {
    marginTop: 20,
  },
  productsSection: {
    maxHeight: 200,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1e293b',
    marginBottom: 8,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  productDetails: {
    fontSize: 14,
    color: '#9ca3af',
  },
  orderItemsSection: {
    marginBottom: 20,
  },
  orderItemCard: {
    marginBottom: 8,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  orderItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
    marginLeft: 'auto',
  },
  stepButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
  createButton: {
    flex: 2,
  },
  reviewCard: {
    marginBottom: 16,
  },
  customerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerSummaryText: {
    marginLeft: 12,
  },
  customerSummaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  customerSummaryEmail: {
    fontSize: 14,
    color: '#9ca3af',
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  reviewItemName: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  reviewItemDetails: {
    fontSize: 14,
    color: '#9ca3af',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  totalValue: {
    fontSize: 14,
    color: '#ffffff',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 8,
    paddingTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
}); 