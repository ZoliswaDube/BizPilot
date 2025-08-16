import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Calendar, 
  DollarSign, 
  User, 
  ShoppingCart,
  X,
  Check,
  Clock,
  Truck,
  CheckCircle
} from 'lucide-react-native';
import { useOrders } from '../../src/hooks/useOrders';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import OrderCreationModal from '../../src/components/orders/OrderCreationModal';
import { mcp_supabase_execute_sql } from '../../src/services/mcpClient';
import { useAuthStore } from '../../src/store/auth';

interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_id?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  order_date: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

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
  sku?: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export default function OrdersScreen() {
  const { business } = useAuthStore();
  const { orders, loading, error, createOrder, updateOrderStatus, refreshOrders } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Order creation state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Load customers and products
  useEffect(() => {
    loadCustomersAndProducts();
  }, [business]);

  const loadCustomersAndProducts = async () => {
    if (!business?.id) return;

    try {
      // Load customers
      const customersResult = await mcp_supabase_execute_sql({
        query: 'SELECT id, name, email, phone FROM customers WHERE business_id = $1 ORDER BY name',
        params: [business.id]
      });

      if (customersResult.success) {
        setCustomers(customersResult.data || []);
      }

      // Load products
      const productsResult = await mcp_supabase_execute_sql({
        query: 'SELECT id, name, price, sku FROM products WHERE business_id = $1 ORDER BY name',
        params: [business.id]
      });

      if (productsResult.success) {
        setProducts(productsResult.data || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '';
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      Alert.alert('Success', 'Order status updated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setOrderItems(items => 
        items.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems(items => [...items, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price
      }]);
    }
    setShowProductModal(false);
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(items => items.filter(item => item.product_id !== productId));
    } else {
      setOrderItems(items => 
        items.map(item => 
          item.product_id === productId 
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const calculateOrderTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxRate = 0.08; // 8% tax - should be configurable
    const tax = subtotal * taxRate;
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleCreateOrder = async () => {
    if (!selectedCustomer || orderItems.length === 0) {
      Alert.alert('Validation Error', 'Please select a customer and add at least one item');
      return;
    }

    setCreatingOrder(true);
    try {
      await createOrder({
        customer_id: selectedCustomer.id,
        items: orderItems,
        notes: orderNotes
      });

      // Reset form
      setSelectedCustomer(null);
      setOrderItems([]);
      setOrderNotes('');
      setShowCreateModal(false);
      
      Alert.alert('Success', 'Order created successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} color="#f59e0b" />;
      case 'confirmed': return <Check size={16} color="#3b82f6" />;
      case 'processing': return <Package size={16} color="#8b5cf6" />;
      case 'shipped': return <Truck size={16} color="#06b6d4" />;
      case 'delivered': return <CheckCircle size={16} color="#10b981" />;
      case 'cancelled': return <X size={16} color="#ef4444" />;
      default: return <Clock size={16} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'processing': return '#8b5cf6';
      case 'shipped': return '#06b6d4';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderOrderCard = (order: Order) => {
    const { subtotal, tax, total } = calculateOrderTotal();
    
    return (
      <Card key={order.id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>{order.order_number}</Text>
            <Text style={styles.customerName}>{order.customer_name || 'Walk-in Customer'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            {getStatusIcon(order.status)}
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.orderMeta}>
            <View style={styles.metaItem}>
              <Calendar size={14} color="#9ca3af" />
              <Text style={styles.metaText}>{new Date(order.order_date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.metaItem}>
              <DollarSign size={14} color="#9ca3af" />
              <Text style={styles.metaText}>${order.total_amount.toFixed(2)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Package size={14} color="#9ca3af" />
              <Text style={styles.metaText}>{order.items.length} items</Text>
            </View>
          </View>

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <View style={styles.statusActions}>
              {order.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#3b82f6' }]}
                  onPress={() => handleStatusUpdate(order.id, 'confirmed')}
                >
                  <Text style={styles.statusButtonText}>Confirm</Text>
                </TouchableOpacity>
              )}
              {order.status === 'confirmed' && (
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#8b5cf6' }]}
                  onPress={() => handleStatusUpdate(order.id, 'processing')}
                >
                  <Text style={styles.statusButtonText}>Process</Text>
                </TouchableOpacity>
              )}
              {order.status === 'processing' && (
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#06b6d4' }]}
                  onPress={() => handleStatusUpdate(order.id, 'shipped')}
                >
                  <Text style={styles.statusButtonText}>Ship</Text>
                </TouchableOpacity>
              )}
              {order.status === 'shipped' && (
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#10b981' }]}
                  onPress={() => handleStatusUpdate(order.id, 'delivered')}
                >
                  <Text style={styles.statusButtonText}>Deliver</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#9ca3af" />
          <Input
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search orders..."
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#a78bfa" />
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusFilter,
              statusFilter === status && styles.activeStatusFilter
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[
              styles.statusFilterText,
              statusFilter === status && styles.activeStatusFilterText
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView
        style={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading orders...</Text>
        ) : filteredOrders.length === 0 ? (
          <Card style={styles.emptyState}>
            <ShoppingCart size={48} color="#6b7280" />
            <Text style={styles.emptyStateTitle}>No orders yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first order to get started
            </Text>
            <Button
              title="Create Order"
              onPress={() => setShowCreateModal(true)}
              style={styles.emptyStateButton}
            />
          </Card>
        ) : (
          filteredOrders.map(renderOrderCard)
        )}
      </ScrollView>

      {/* Create Order Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Order</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Customer Selection */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Customer</Text>
              <TouchableOpacity
                style={styles.customerSelector}
                onPress={() => setShowCustomerModal(true)}
              >
                <User size={20} color="#a78bfa" />
                <Text style={styles.customerText}>
                  {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
                </Text>
              </TouchableOpacity>
            </Card>

            {/* Order Items */}
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Items</Text>
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={() => setShowProductModal(true)}
                >
                  <Plus size={16} color="#a78bfa" />
                  <Text style={styles.addItemText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {orderItems.map((item, index) => (
                <View key={item.product_id} style={styles.orderItem}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <View style={styles.itemControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                    <Text style={styles.itemPrice}>
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>

            {/* Order Summary */}
            {orderItems.length > 0 && (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal:</Text>
                  <Text style={styles.summaryValue}>${calculateOrderTotal().subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax:</Text>
                  <Text style={styles.summaryValue}>${calculateOrderTotal().tax.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>${calculateOrderTotal().total.toFixed(2)}</Text>
                </View>
              </Card>
            )}

            {/* Notes */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <Input
                value={orderNotes}
                onChangeText={setOrderNotes}
                placeholder="Add notes for this order..."
                multiline
                numberOfLines={3}
              />
            </Card>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setShowCreateModal(false)}
              style={styles.cancelButton}
            />
            <Button
              title="Create Order"
              onPress={handleCreateOrder}
              loading={creatingOrder}
              disabled={!selectedCustomer || orderItems.length === 0}
              style={styles.createButton}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerItem}
                onPress={() => {
                  setSelectedCustomer(item);
                  setShowCustomerModal(false);
                }}
              >
                <Text style={styles.customerItemName}>{item.name}</Text>
                {item.email && <Text style={styles.customerItemEmail}>{item.email}</Text>}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Product</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productItem}
                onPress={() => addProductToOrder(item)}
              >
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  {item.sku && <Text style={styles.productSku}>SKU: {item.sku}</Text>}
                </View>
                <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Enhanced Order Creation Modal */}
      <OrderCreationModal
        visible={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onOrderCreated={() => {
          setShowOrderModal(false);
          refreshOrders();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusFilters: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 8,
  },
  activeStatusFilter: {
    backgroundColor: '#a78bfa',
  },
  statusFilterText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  activeStatusFilterText: {
    color: '#ffffff',
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orderCard: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    gap: 12,
  },
  orderMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    minWidth: 150,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    gap: 12,
  },
  customerText: {
    fontSize: 16,
    color: '#e5e7eb',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemText: {
    fontSize: 14,
    color: '#a78bfa',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  itemName: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    color: '#a78bfa',
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 16,
    color: '#ffffff',
    minWidth: 24,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 16,
    color: '#a78bfa',
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  summaryValue: {
    fontSize: 14,
    color: '#ffffff',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a78bfa',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  cancelButton: {
    flex: 1,
  },
  createButton: {
    flex: 1,
  },
  customerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  customerItemName: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  customerItemEmail: {
    fontSize: 14,
    color: '#9ca3af',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: '#9ca3af',
  },
  productPrice: {
    fontSize: 16,
    color: '#a78bfa',
    fontWeight: '600',
  },
}); 