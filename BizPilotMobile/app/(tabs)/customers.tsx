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
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Search, 
  Filter, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Edit3,
  Trash2,
  X,
  Users,
  TrendingUp,
} from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { mcp_supabase_execute_sql } from '../../src/services/mcpClient';
import { useAuthStore } from '../../src/store/auth';
import * as Haptics from 'expo-haptics';
import * as Contacts from 'expo-contacts';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  notes?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  customer_since: string;
  is_active: boolean;
  tags?: string[];
  average_order_value: number;
  preferred_contact_method: 'email' | 'phone' | 'sms';
  company?: string;
}

interface CustomerStats {
  total_customers: number;
  active_customers: number;
  total_revenue: number;
  average_order_value: number;
}

export default function CustomersScreen() {
  const { business, user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    total_customers: 0,
    active_customers: 0,
    total_revenue: 0,
    average_order_value: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'total_spent' | 'last_order' | 'customer_since'>('name');

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [business]);

  const fetchCustomers = async () => {
    if (!business?.id) return;

    try {
      setLoading(true);
      
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            c.*,
            COALESCE(c.total_orders, 0) as total_orders,
            COALESCE(c.total_spent, 0) as total_spent,
            COALESCE(c.average_order_value, 0) as average_order_value,
            c.last_order_date,
            c.customer_since,
            c.is_active,
            c.tags,
            c.preferred_contact_method,
            c.company
          FROM customers c
          WHERE c.business_id = $1
          ORDER BY 
            CASE 
              WHEN $2 = 'name' THEN c.name
              WHEN $2 = 'customer_since' THEN c.customer_since::text
              ELSE c.name
            END ASC,
            CASE 
              WHEN $2 = 'total_spent' THEN c.total_spent
              WHEN $2 = 'last_order' THEN EXTRACT(EPOCH FROM c.last_order_date)
              ELSE 0
            END DESC
        `,
        params: [business.id, sortBy]
      });

      if (result.success) {
        const processedCustomers = result.data.map(customer => ({
          ...customer,
          address: customer.address ? (typeof customer.address === 'string' ? JSON.parse(customer.address) : customer.address) : null,
          tags: customer.tags || [],
        }));
        setCustomers(processedCustomers);
      } else {
        throw new Error(result.error || 'Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!business?.id) return;

    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            COUNT(*) as total_customers,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active_customers,
            COALESCE(SUM(total_spent), 0) as total_revenue,
            COALESCE(AVG(average_order_value), 0) as average_order_value
          FROM customers 
          WHERE business_id = $1
        `,
        params: [business.id]
      });

      if (result.success && result.data?.[0]) {
        setStats({
          total_customers: parseInt(result.data[0].total_customers) || 0,
          active_customers: parseInt(result.data[0].active_customers) || 0,
          total_revenue: parseFloat(result.data[0].total_revenue) || 0,
          average_order_value: parseFloat(result.data[0].average_order_value) || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await Promise.all([fetchCustomers(), fetchStats()]);
    setRefreshing(false);
  };

  const handleCreateCustomer = async (customerData: Partial<Customer>) => {
    if (!business?.id || !user?.id) {
      Alert.alert('Error', 'Missing business or user information');
      return;
    }

    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO customers (
            business_id, name, email, phone, address, notes, 
            company, preferred_contact_method, is_active, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
          RETURNING id
        `,
        params: [
          business.id,
          customerData.name,
          customerData.email || null,
          customerData.phone || null,
          customerData.address ? JSON.stringify(customerData.address) : null,
          customerData.notes || null,
          customerData.company || null,
          customerData.preferred_contact_method || 'email',
          user.id
        ]
      });

      if (result.success) {
        Alert.alert('Success', 'Customer created successfully');
        setShowCreateModal(false);
        await fetchCustomers();
        await fetchStats();
      } else {
        throw new Error(result.error || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Error', 'Failed to create customer. Please try again.');
    }
  };

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete "${customerName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await mcp_supabase_execute_sql({
                query: 'UPDATE customers SET is_active = false WHERE id = $1 AND business_id = $2',
                params: [customerId, business?.id]
              });

              if (result.success) {
                Alert.alert('Success', 'Customer deleted successfully');
                await fetchCustomers();
                await fetchStats();
              } else {
                throw new Error('Failed to delete customer');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete customer');
            }
          },
        },
      ]
    );
  };

  const handleContactCustomer = (customer: Customer, method: 'phone' | 'email') => {
    if (method === 'phone' && customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    } else if (method === 'email' && customer.email) {
      Linking.openURL(`mailto:${customer.email}`);
    } else {
      Alert.alert('Contact Info Missing', `No ${method} available for this customer`);
    }
  };

  const importFromContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to contacts to import customers');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      if (data.length > 0) {
        // Show contact selection modal (simplified for now)
        Alert.alert(
          'Import Contacts',
          `Found ${data.length} contacts. This feature will be enhanced to allow selective import.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access contacts');
    }
  };

  const getFilteredCustomers = () => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone?.includes(searchTerm) ||
                           customer.company?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesActiveFilter = filterActive === null || customer.is_active === filterActive;

      return matchesSearch && matchesActiveFilter;
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.cardTitle}>Customer Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Users size={24} color="#a78bfa" />
          <Text style={styles.statValue}>{stats.total_customers}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={styles.statItem}>
          <User size={24} color="#22c55e" />
          <Text style={styles.statValue}>{stats.active_customers}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        
        <View style={styles.statItem}>
          <DollarSign size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{formatCurrency(stats.total_revenue)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        
        <View style={styles.statItem}>
          <TrendingUp size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{formatCurrency(stats.average_order_value)}</Text>
          <Text style={styles.statLabel}>Avg Order</Text>
        </View>
      </View>
    </Card>
  );

  const renderCustomerCard = (customer: Customer) => (
    <Card key={customer.id} style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={styles.customerAvatar}>
          <User size={24} color="#a78bfa" />
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.name}</Text>
          {customer.company && (
            <Text style={styles.customerCompany}>{customer.company}</Text>
          )}
          <Text style={styles.customerSince}>
            Customer since {formatDate(customer.customer_since)}
          </Text>
        </View>
        <View style={styles.customerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleContactCustomer(customer, 'phone')}
          >
            <Phone size={16} color="#22c55e" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleContactCustomer(customer, 'email')}
          >
            <Mail size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteCustomer(customer.id, customer.name)}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.customerMetrics}>
        <View style={styles.metricItem}>
          <ShoppingBag size={16} color="#a78bfa" />
          <Text style={styles.metricValue}>{customer.total_orders}</Text>
          <Text style={styles.metricLabel}>Orders</Text>
        </View>
        <View style={styles.metricItem}>
          <DollarSign size={16} color="#22c55e" />
          <Text style={styles.metricValue}>{formatCurrency(customer.total_spent)}</Text>
          <Text style={styles.metricLabel}>Total Spent</Text>
        </View>
        <View style={styles.metricItem}>
          <Calendar size={16} color="#f59e0b" />
          <Text style={styles.metricValue}>{formatDate(customer.last_order_date)}</Text>
          <Text style={styles.metricLabel}>Last Order</Text>
        </View>
      </View>

      {customer.notes && (
        <Text style={styles.customerNotes}>{customer.notes}</Text>
      )}
    </Card>
  );

  const filteredCustomers = getFilteredCustomers();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" style={styles.searchIcon} />
          <Input
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search customers..."
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#a78bfa" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <Card style={styles.filtersCard}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, filterActive === null && styles.activeFilterChip]}
              onPress={() => setFilterActive(null)}
            >
              <Text style={[styles.filterChipText, filterActive === null && styles.activeFilterChipText]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterActive === true && styles.activeFilterChip]}
              onPress={() => setFilterActive(true)}
            >
              <Text style={[styles.filterChipText, filterActive === true && styles.activeFilterChipText]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterActive === false && styles.activeFilterChip]}
              onPress={() => setFilterActive(false)}
            >
              <Text style={[styles.filterChipText, filterActive === false && styles.activeFilterChipText]}>
                Inactive
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        {renderStatsCard()}

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              title="Import Contacts"
              onPress={importFromContacts}
              style={styles.actionButtonStyle}
            />
            <Button
              title="Export List"
              variant="secondary"
              onPress={() => Alert.alert('Export', 'Export functionality coming soon')}
              style={styles.actionButtonStyle}
            />
          </View>
        </Card>

        {/* Customers List */}
        <View style={styles.customersSection}>
          <Text style={styles.sectionTitle}>
            Customers ({filteredCustomers.length})
          </Text>
          
          {loading ? (
            <Card style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading customers...</Text>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card style={styles.emptyState}>
              <Users size={48} color="#6b7280" />
              <Text style={styles.emptyStateTitle}>No customers found</Text>
              <Text style={styles.emptyStateText}>
                {customers.length === 0 
                  ? 'Start by adding your first customer'
                  : 'Try adjusting your search or filter criteria'
                }
              </Text>
              {customers.length === 0 && (
                <Button
                  title="Add Customer"
                  onPress={() => setShowCreateModal(true)}
                  style={styles.emptyStateButton}
                />
              )}
            </Card>
          ) : (
            filteredCustomers.map(renderCustomerCard)
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateCustomer}
      />
    </SafeAreaView>
  );
}

// Create Customer Modal Component
const CreateCustomerModal = ({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: Partial<Customer>) => void;
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredContact, setPreferredContact] = useState<'email' | 'phone' | 'sms'>('email');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a customer name');
      return;
    }

    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        notes: notes.trim() || undefined,
        preferred_contact_method: preferredContact,
      });

      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setNotes('');
      setPreferredContact('email');
    } catch (error) {
      console.error('Error creating customer:', error);
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
            <X size={24} color="#9ca3af" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Customer</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Customer name *"
            style={styles.modalInput}
          />

          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.modalInput}
          />

          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
            style={styles.modalInput}
          />

          <Input
            value={company}
            onChangeText={setCompany}
            placeholder="Company (optional)"
            style={styles.modalInput}
          />

          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (optional)"
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />

          <Text style={styles.inputLabel}>Preferred Contact Method</Text>
          <View style={styles.contactMethodRow}>
            {(['email', 'phone', 'sms'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.contactMethodChip,
                  preferredContact === method && styles.activeContactMethodChip
                ]}
                onPress={() => setPreferredContact(method)}
              >
                <Text style={[
                  styles.contactMethodText,
                  preferredContact === method && styles.activeContactMethodText
                ]}>
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onClose}
            style={styles.modalCancelButton}
          />
          <Button
            title="Add Customer"
            onPress={handleCreate}
            loading={loading}
            disabled={!name.trim()}
            style={styles.modalAddButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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
    fontSize: 28,
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
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
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
  filtersCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeFilterChip: {
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
  filterChipText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonStyle: {
    flex: 1,
  },
  customersSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  customerCard: {
    marginBottom: 16,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
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
  customerCompany: {
    fontSize: 14,
    color: '#a78bfa',
    marginBottom: 2,
  },
  customerSince: {
    fontSize: 12,
    color: '#9ca3af',
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 4,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  customerNotes: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  emptyStateButton: {
    paddingHorizontal: 32,
  },
  bottomSpacing: {
    height: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerPlaceholder: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalInput: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 8,
  },
  contactMethodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  contactMethodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeContactMethodChip: {
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
  contactMethodText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activeContactMethodText: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  modalCancelButton: {
    flex: 1,
  },
  modalAddButton: {
    flex: 1,
  },
});