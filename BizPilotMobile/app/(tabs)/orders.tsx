import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Filter, Package, Calendar, DollarSign } from 'lucide-react-native';
import { useOrders } from '../../src/hooks/useOrders';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { theme } from '../../src/styles/theme';

interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  order_date: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

export default function OrdersScreen() {
  const { orders, loading, error, createOrder, updateOrderStatus, refreshOrders } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.yellow[500];
      case 'confirmed': return theme.colors.blue[500];
      case 'processing': return theme.colors.orange[500];
      case 'shipped': return theme.colors.primary[500];
      case 'delivered': return theme.colors.green[500];
      case 'cancelled': return theme.colors.red[500];
      default: return theme.colors.gray[500];
    }
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          <Text style={styles.customerName}>{order.customer_name || 'Walk-in Customer'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Package size={16} color={theme.colors.gray[400]} />
          <Text style={styles.detailText}>
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={16} color={theme.colors.gray[400]} />
          <Text style={styles.detailText}>
            {new Date(order.order_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <DollarSign size={16} color={theme.colors.gray[400]} />
          <Text style={styles.detailText}>${order.total_amount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.orderActions}>
        {order.status === 'pending' && (
          <Button
            title="Confirm"
            variant="primary"
            size="sm"
            onPress={() => handleStatusUpdate(order.id, 'confirmed')}
            style={styles.actionButton}
          />
        )}
        {order.status === 'confirmed' && (
          <Button
            title="Process"
            variant="secondary"
            size="sm"
            onPress={() => handleStatusUpdate(order.id, 'processing')}
            style={styles.actionButton}
          />
        )}
        {order.status === 'processing' && (
          <Button
            title="Ship"
            variant="primary"
            size="sm"
            onPress={() => handleStatusUpdate(order.id, 'shipped')}
            style={styles.actionButton}
          />
        )}
      </View>
    </Card>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Button title="Retry" onPress={refreshOrders} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={theme.colors.gray[400]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor={theme.colors.gray[400]}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={theme.colors.gray[400]} />
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilter}>
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusFilterButton,
              statusFilter === status && styles.statusFilterButtonActive
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[
              styles.statusFilterText,
              statusFilter === status && styles.statusFilterTextActive
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
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={48} color={theme.colors.gray[400]} />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter'
                : 'Create your first order to get started'
              }
            </Text>
          </View>
        ) : (
          filteredOrders.map(renderOrderCard)
        )}
      </ScrollView>

      {/* Create Order Modal */}
      <CreateOrderModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createOrder}
      />
    </SafeAreaView>
  );
}

// Simple Create Order Modal Component
const CreateOrderModal = ({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<string>;
}) => {
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await onCreate({
        items: [
          {
            product_id: 'sample_product',
            quantity: 1,
            unit_price: 100
          }
        ],
        notes: customerName ? `Customer: ${customerName}` : undefined
      });
      Alert.alert('Success', 'Order created successfully');
      onClose();
      setCustomerName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create order');
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
          <Text style={styles.modalTitle}>New Order</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.modalContent}>
          <Input
            label="Customer Name (Optional)"
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Enter customer name"
          />
          
          <View style={styles.modalActions}>
            <Button
              title="Create Order"
              onPress={handleCreate}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
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
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
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
  statusFilter: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  statusFilterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.dark[800],
  },
  statusFilterButtonActive: {
    backgroundColor: theme.colors.primary[600],
  },
  statusFilterText: {
    color: theme.colors.gray[300],
    fontSize: theme.fontSize.sm,
  },
  statusFilterTextActive: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  orderCard: {
    marginBottom: theme.spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  customerName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  orderDetails: {
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[300],
    marginLeft: theme.spacing.sm,
  },
  orderActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[300],
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.red[500],
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark[700],
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  modalCancelButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary[500],
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  modalActions: {
    marginTop: theme.spacing.xl,
  },
}); 