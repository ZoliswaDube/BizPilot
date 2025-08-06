import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  BarChart3,
  Star,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Target,
} from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import CustomerAnalytics from '../../src/components/customers/CustomerAnalytics';
import { mcp_supabase_execute_sql } from '../../src/services/mcpClient';
import { useAuthStore } from '../../src/store/auth';
import * as Haptics from 'expo-haptics';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  customer_since: string;
  is_active: boolean;
  segment: 'VIP' | 'Loyal' | 'Regular' | 'New' | 'At Risk' | 'Churned';
}

interface CustomerStats {
  total_customers: number;
  active_customers: number;
  new_this_month: number;
  total_revenue: number;
  average_order_value: number;
  repeat_rate: number;
}

export default function CustomersScreen() {
  const { business } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'customers' | 'analytics'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    total_customers: 0,
    active_customers: 0,
    new_this_month: 0,
    total_revenue: 0,
    average_order_value: 0,
    repeat_rate: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCustomerData();
  }, [business]);

  const loadCustomerData = async () => {
    if (!business?.id) return;

    try {
      await Promise.all([
        loadCustomers(),
        loadCustomerStats(),
      ]);
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          WITH customer_segments AS (
            SELECT 
              c.*,
              CASE 
                WHEN c.total_spent > 5000 AND c.total_orders > 10 THEN 'VIP'
                WHEN c.total_spent > 2000 AND c.total_orders > 5 THEN 'Loyal'
                WHEN EXTRACT(days FROM NOW() - c.last_order_date) > 90 THEN 'At Risk'
                WHEN EXTRACT(days FROM NOW() - c.last_order_date) > 180 THEN 'Churned'
                WHEN c.total_orders = 0 THEN 'New'
                ELSE 'Regular'
              END as segment
            FROM customers c
            WHERE c.business_id = $1
          )
          SELECT * FROM customer_segments
          ORDER BY total_spent DESC, name ASC
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

  const loadCustomerStats = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            COUNT(*)::integer as total_customers,
            COUNT(CASE WHEN is_active = true THEN 1 END)::integer as active_customers,
            COUNT(CASE 
              WHEN customer_since >= DATE_TRUNC('month', CURRENT_DATE) 
              THEN 1 
            END)::integer as new_this_month,
            COALESCE(SUM(total_spent), 0) as total_revenue,
            COALESCE(AVG(
              CASE 
                WHEN total_orders > 0 
                THEN total_spent / total_orders 
                ELSE 0 
              END
            ), 0) as average_order_value,
            COALESCE(
              COUNT(CASE WHEN total_orders > 1 THEN 1 END)::float / 
              NULLIF(COUNT(*)::float, 0) * 100, 
              0
            ) as repeat_rate
          FROM customers
          WHERE business_id = $1
        `,
        params: [business?.id]
      });

      if (result.success && result.data?.[0]) {
        setStats(result.data[0]);
      }
    } catch (error) {
      console.error('Error loading customer stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadCustomerData();
    setRefreshing(false);
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

  const getSegmentColor = (segment: string): string => {
    switch (segment) {
      case 'VIP':
        return '#f59e0b';
      case 'Loyal':
        return '#3b82f6';
      case 'Regular':
        return '#22c55e';
      case 'New':
        return '#a78bfa';
      case 'At Risk':
        return '#ef4444';
      case 'Churned':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return <Star size={14} color="#f59e0b" />;
      case 'Loyal':
        return <Target size={14} color="#3b82f6" />;
      case 'At Risk':
        return <TrendingUp size={14} color="#ef4444" />;
      default:
        return <Users size={14} color="#6b7280" />;
    }
  };

  const getFilteredCustomers = () => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone?.includes(searchTerm);
      
      const matchesSegment = selectedSegment === 'all' || customer.segment === selectedSegment;

      return matchesSearch && matchesSegment;
    });
  };

  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.cardTitle}>Customer Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Users size={24} color="#a78bfa" />
          <Text style={styles.statValue}>{stats.total_customers}</Text>
          <Text style={styles.statLabel}>Total Customers</Text>
        </View>
        
        <View style={styles.statItem}>
          <DollarSign size={24} color="#22c55e" />
          <Text style={styles.statValue}>{formatCurrency(stats.total_revenue)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        
        <View style={styles.statItem}>
          <ShoppingCart size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{formatCurrency(stats.average_order_value)}</Text>
          <Text style={styles.statLabel}>Avg Order Value</Text>
        </View>
        
        <View style={styles.statItem}>
          <TrendingUp size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.repeat_rate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Repeat Rate</Text>
        </View>
      </View>
    </Card>
  );

  const renderFilters = () => (
    <Card style={styles.filtersCard}>
      <View style={styles.filtersHeader}>
        <Text style={styles.cardTitle}>Filters</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterToggle}
        >
          <Filter size={20} color="#a78bfa" />
        </TouchableOpacity>
      </View>

      <Input
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Search customers..."
        style={styles.searchInput}
      />

      {showFilters && (
        <View style={styles.segmentFilters}>
          <Text style={styles.filterLabel}>Customer Segment:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.segmentButtons}>
              {['all', 'VIP', 'Loyal', 'Regular', 'New', 'At Risk', 'Churned'].map((segment) => (
                <TouchableOpacity
                  key={segment}
                  style={[
                    styles.segmentButton,
                    selectedSegment === segment && styles.activeSegmentButton,
                    segment !== 'all' && { backgroundColor: getSegmentColor(segment) + '20' }
                  ]}
                  onPress={() => {
                    setSelectedSegment(segment);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[
                    styles.segmentButtonText,
                    selectedSegment === segment && styles.activeSegmentButtonText,
                    segment !== 'all' && { color: getSegmentColor(segment) }
                  ]}>
                    {segment === 'all' ? 'All' : segment}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </Card>
  );

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity style={styles.customerItem}>
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <View style={styles.customerContact}>
            {item.email && (
              <View style={styles.contactItem}>
                <Mail size={12} color="#9ca3af" />
                <Text style={styles.contactText}>{item.email}</Text>
              </View>
            )}
            {item.phone && (
              <View style={styles.contactItem}>
                <Phone size={12} color="#9ca3af" />
                <Text style={styles.contactText}>{item.phone}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.customerSegmentBadge}>
          <View style={[
            styles.segmentBadge,
            { backgroundColor: getSegmentColor(item.segment) + '20' }
          ]}>
            {getSegmentIcon(item.segment)}
            <Text style={[
              styles.segmentBadgeText,
              { color: getSegmentColor(item.segment) }
            ]}>
              {item.segment}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.customerMetrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{formatCurrency(item.total_spent)}</Text>
          <Text style={styles.metricLabel}>Total Spent</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{item.total_orders}</Text>
          <Text style={styles.metricLabel}>Orders</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{formatDate(item.last_order_date)}</Text>
          <Text style={styles.metricLabel}>Last Order</Text>
        </View>
      </View>

      <View style={styles.customerFooter}>
        <View style={styles.customerSince}>
          <Calendar size={12} color="#6b7280" />
          <Text style={styles.customerSinceText}>
            Customer since {formatDate(item.customer_since)}
          </Text>
        </View>
        
        <View style={[
          styles.statusIndicator,
          item.is_active ? styles.activeStatus : styles.inactiveStatus
        ]}>
          <Text style={[
            styles.statusText,
            item.is_active ? styles.activeStatusText : styles.inactiveStatusText
          ]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCustomersTab = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Stats */}
      {renderStatsCard()}

      {/* Filters */}
      {renderFilters()}

      {/* Customer List */}
      <Card style={styles.customersCard}>
        <View style={styles.customersHeader}>
          <Text style={styles.cardTitle}>
            Customers ({getFilteredCustomers().length})
          </Text>
          <TouchableOpacity style={styles.addButton}>
            <UserPlus size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={getFilteredCustomers()}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Users size={48} color="#6b7280" />
              <Text style={styles.emptyStateText}>No customers found</Text>
              <Text style={styles.emptyStateSubtext}>
                {customers.length === 0 
                  ? 'Add your first customer to get started'
                  : 'Try adjusting your search or filters'
                }
              </Text>
            </View>
          )}
        />
      </Card>
    </ScrollView>
  );

  const renderAnalyticsTab = () => (
    <CustomerAnalytics />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customers' && styles.activeTab]}
          onPress={() => {
            setActiveTab('customers');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Users size={20} color={activeTab === 'customers' ? '#a78bfa' : '#9ca3af'} />
          <Text style={[
            styles.tabText,
            activeTab === 'customers' && styles.activeTabText
          ]}>
            Customers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => {
            setActiveTab('analytics');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <BarChart3 size={20} color={activeTab === 'analytics' ? '#a78bfa' : '#9ca3af'} />
          <Text style={[
            styles.tabText,
            activeTab === 'analytics' && styles.activeTabText
          ]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'customers' ? renderCustomersTab() : renderAnalyticsTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#1e293b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#a78bfa',
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
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  filtersCard: {
    marginBottom: 16,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterToggle: {
    padding: 4,
  },
  searchInput: {
    marginBottom: 12,
  },
  segmentFilters: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 12,
  },
  segmentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#334155',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeSegmentButton: {
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },
  activeSegmentButtonText: {
    color: '#ffffff',
  },
  customersCard: {
    marginBottom: 16,
  },
  customersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#a78bfa',
    borderRadius: 8,
    padding: 8,
  },
  customerItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  customerContact: {
    gap: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  customerSegmentBadge: {
    marginLeft: 12,
  },
  segmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  segmentBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  customerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  customerSince: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerSinceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: '#22c55e20',
  },
  inactiveStatus: {
    backgroundColor: '#ef444420',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  activeStatusText: {
    color: '#22c55e',
  },
  inactiveStatusText: {
    color: '#ef4444',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
}); 