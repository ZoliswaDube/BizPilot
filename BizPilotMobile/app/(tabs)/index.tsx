import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, TrendingUp, Package, Users, DollarSign } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { mcp_supabase_execute_sql } from '../../src/services/mcpClient';
import * as Haptics from 'expo-haptics';

interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  profit: number;
}

interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
  type: 'order' | 'inventory' | 'payment' | 'customer';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, business } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    total_revenue: 0,
    total_orders: 0,
    total_customers: 0,
    profit: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [business]);

  const loadDashboardData = async () => {
    if (!business?.id) return;

    try {
      await Promise.all([
        loadStats(),
        loadRecentActivities(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            COALESCE(SUM(o.total_amount), 0) as total_revenue,
            COUNT(o.id) as total_orders,
            (SELECT COUNT(*) FROM customers WHERE business_id = $1) as total_customers,
            COALESCE(SUM(o.total_amount - o.subtotal), 0) as profit
          FROM orders o
          WHERE o.business_id = $1
            AND o.status != 'cancelled'
            AND o.order_date >= DATE_TRUNC('month', CURRENT_DATE)
        `,
        params: [business?.id]
      });

      if (result.success && result.data?.[0]) {
        setStats({
          total_revenue: parseFloat(result.data[0].total_revenue) || 0,
          total_orders: parseInt(result.data[0].total_orders) || 0,
          total_customers: parseInt(result.data[0].total_customers) || 0,
          profit: parseFloat(result.data[0].profit) || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          (
            SELECT 
              'order' as type,
              o.id,
              'New order #' || o.order_number || ' from ' || COALESCE(c.name, 'Walk-in Customer') as description,
              o.created_at as timestamp
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.business_id = $1
            ORDER BY o.created_at DESC
            LIMIT 3
          )
          UNION ALL
          (
            SELECT 
              'inventory' as type,
              it.id,
              'Inventory updated: ' || it.product_name as description,
              it.created_at as timestamp
            FROM inventory_transactions it
            WHERE it.business_id = $1
            ORDER BY it.created_at DESC
            LIMIT 2
          )
          ORDER BY timestamp DESC
          LIMIT 5
        `,
        params: [business?.id]
      });

      if (result.success) {
        setActivities(result.data || []);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    loadDashboardData().finally(() => {
      setRefreshing(false);
    });
  }, [business]);

  const handleQuickAction = (action: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    switch (action) {
      case 'new-order':
        router.push('/orders');
        break;
      case 'add-customer':
        router.push('/customers');
        break;
      case 'add-product':
        router.push('/products');
        break;
      case 'view-reports':
        router.push('/financial');
        break;
      default:
        console.log(`Unknown quick action: ${action}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#a78bfa"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!</Text>
          <Text style={styles.businessName}>{business?.name || 'BizPilot Business'}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#22c55e" />
            <Text style={styles.statValue}>{formatCurrency(stats.total_revenue)}</Text>
            <Text style={styles.statLabel}>Revenue (MTD)</Text>
          </View>
          
          <View style={styles.statCard}>
            <Package size={24} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.total_orders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          
          <View style={styles.statCard}>
            <Users size={24} color="#a78bfa" />
            <Text style={styles.statValue}>{stats.total_customers}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
          
          <View style={styles.statCard}>
            <DollarSign size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{formatCurrency(stats.profit)}</Text>
            <Text style={styles.statLabel}>Profit (MTD)</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('new-order')}
            >
              <Plus size={24} color="#ffffff" />
              <Text style={styles.actionText}>New Order</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('add-customer')}
            >
              <Users size={24} color="#ffffff" />
              <Text style={styles.actionText}>Add Customer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('add-product')}
            >
              <Package size={24} color="#ffffff" />
              <Text style={styles.actionText}>Add Product</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('view-reports')}
            >
              <TrendingUp size={24} color="#ffffff" />
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {loading ? (
            <View style={styles.activityCard}>
              <Text style={styles.activityText}>Loading recent activity...</Text>
            </View>
          ) : activities.length === 0 ? (
            <View style={styles.activityCard}>
              <Text style={styles.activityText}>No recent activity</Text>
              <Text style={styles.activityTime}>Start by creating your first order</Text>
            </View>
          ) : (
            activities.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <Text style={styles.activityText}>{activity.description}</Text>
                <Text style={styles.activityTime}>{formatDate(activity.timestamp)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#a78bfa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activityText: {
    color: '#e5e7eb',
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
    color: '#9ca3af',
    fontSize: 12,
  },
}); 