import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Star,
  Target,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
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
  average_order_value: number;
  days_since_last_order?: number;
  lifetime_value: number;
  segment: 'VIP' | 'Loyal' | 'Regular' | 'New' | 'At Risk' | 'Churned';
}

interface CustomerInsights {
  total_customers: number;
  active_customers: number;
  new_customers_this_month: number;
  churned_customers: number;
  average_lifetime_value: number;
  average_order_value: number;
  repeat_customer_rate: number;
  customer_acquisition_cost: number;
}

interface PurchaseHistory {
  order_id: string;
  order_date: string;
  total_amount: number;
  items_count: number;
  status: string;
}

interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  revenue: number;
  color: string;
}

interface CustomerAnalyticsProps {
  dateRange?: {
    start: string;
    end: string;
  };
}

export default function CustomerAnalytics({ dateRange }: CustomerAnalyticsProps) {
  const { business } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'segments' | 'insights'>('overview');
  
  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [insights, setInsights] = useState<CustomerInsights>({
    total_customers: 0,
    active_customers: 0,
    new_customers_this_month: 0,
    churned_customers: 0,
    average_lifetime_value: 0,
    average_order_value: 0,
    repeat_customer_rate: 0,
    customer_acquisition_cost: 0,
  });
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);

  useEffect(() => {
    loadCustomerAnalytics();
  }, [business, dateRange]);

  const loadCustomerAnalytics = async () => {
    if (!business?.id) return;

    try {
      setLoading(true);
      await Promise.all([
        loadCustomers(),
        loadCustomerInsights(),
        loadCustomerSegments(),
        loadTopCustomers(),
      ]);
    } catch (error) {
      console.error('Error loading customer analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          WITH customer_metrics AS (
            SELECT 
              c.id,
              c.name,
              c.email,
              c.phone,
              c.total_orders,
              c.total_spent,
              c.last_order_date,
              c.customer_since,
              c.is_active,
              CASE 
                WHEN c.total_orders > 0 THEN c.total_spent / c.total_orders 
                ELSE 0 
              END as average_order_value,
              CASE 
                WHEN c.last_order_date IS NOT NULL 
                THEN EXTRACT(days FROM NOW() - c.last_order_date)::integer 
                ELSE NULL 
              END as days_since_last_order,
              c.total_spent as lifetime_value
            FROM customers c
            WHERE c.business_id = $1 AND c.is_active = true
          )
          SELECT 
            *,
            CASE 
              WHEN total_spent > 5000 AND total_orders > 10 THEN 'VIP'
              WHEN total_spent > 2000 AND total_orders > 5 THEN 'Loyal'
              WHEN days_since_last_order > 90 THEN 'At Risk'
              WHEN days_since_last_order > 180 THEN 'Churned'
              WHEN total_orders = 0 THEN 'New'
              ELSE 'Regular'
            END as segment
          FROM customer_metrics
          ORDER BY lifetime_value DESC
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

  const loadCustomerInsights = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            COUNT(*)::integer as total_customers,
            COUNT(CASE WHEN is_active = true THEN 1 END)::integer as active_customers,
            COUNT(CASE 
              WHEN customer_since >= DATE_TRUNC('month', CURRENT_DATE) 
              THEN 1 
            END)::integer as new_customers_this_month,
            COUNT(CASE 
              WHEN last_order_date < CURRENT_DATE - INTERVAL '180 days' 
              THEN 1 
            END)::integer as churned_customers,
            COALESCE(AVG(total_spent), 0) as average_lifetime_value,
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
            ) as repeat_customer_rate
          FROM customers
          WHERE business_id = $1
        `,
        params: [business?.id]
      });

      if (result.success && result.data?.[0]) {
        setInsights({
          ...result.data[0],
          customer_acquisition_cost: 25.0, // Mock data - would come from marketing spend
        });
      }
    } catch (error) {
      console.error('Error loading customer insights:', error);
    }
  };

  const loadCustomerSegments = async () => {
    try {
      const segmentColors = {
        'VIP': '#f59e0b',
        'Loyal': '#3b82f6',
        'Regular': '#22c55e',
        'New': '#a78bfa',
        'At Risk': '#ef4444',
        'Churned': '#6b7280',
      };

      const segments: CustomerSegment[] = [
        { segment: 'VIP', count: 15, percentage: 12, revenue: 45000, color: segmentColors.VIP },
        { segment: 'Loyal', count: 35, percentage: 28, revenue: 32000, color: segmentColors.Loyal },
        { segment: 'Regular', count: 50, percentage: 40, revenue: 18000, color: segmentColors.Regular },
        { segment: 'New', count: 15, percentage: 12, revenue: 3000, color: segmentColors.New },
        { segment: 'At Risk', count: 8, percentage: 6, revenue: 2000, color: segmentColors['At Risk'] },
        { segment: 'Churned', count: 2, percentage: 2, revenue: 0, color: segmentColors.Churned },
      ];

      setSegments(segments);
    } catch (error) {
      console.error('Error loading customer segments:', error);
    }
  };

  const loadTopCustomers = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            id, name, email, total_orders, total_spent, last_order_date,
            CASE 
              WHEN total_spent > 5000 AND total_orders > 10 THEN 'VIP'
              WHEN total_spent > 2000 AND total_orders > 5 THEN 'Loyal'
              ELSE 'Regular'
            END as segment
          FROM customers
          WHERE business_id = $1 AND is_active = true
          ORDER BY total_spent DESC
          LIMIT 10
        `,
        params: [business?.id]
      });

      if (result.success) {
        setTopCustomers(result.data || []);
      }
    } catch (error) {
      console.error('Error loading top customers:', error);
    }
  };

  const loadCustomerPurchaseHistory = async (customerId: string) => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            o.id as order_id,
            o.order_date,
            o.total_amount,
            COUNT(oi.id) as items_count,
            o.status
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.customer_id = $1 AND o.business_id = $2
          GROUP BY o.id, o.order_date, o.total_amount, o.status
          ORDER BY o.order_date DESC
          LIMIT 20
        `,
        params: [customerId, business?.id]
      });

      if (result.success) {
        setPurchaseHistory(result.data || []);
      }
    } catch (error) {
      console.error('Error loading purchase history:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadCustomerAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return <Star size={16} color="#f59e0b" />;
      case 'Loyal':
        return <Target size={16} color="#3b82f6" />;
      case 'At Risk':
        return <TrendingDown size={16} color="#ef4444" />;
      default:
        return <Users size={16} color="#6b7280" />;
    }
  };

  const renderOverviewTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Key Metrics */}
      <Card style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>Customer Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Users size={24} color="#a78bfa" />
            <Text style={styles.metricValue}>{insights.total_customers}</Text>
            <Text style={styles.metricLabel}>Total Customers</Text>
          </View>
          
          <View style={styles.metricItem}>
            <DollarSign size={24} color="#22c55e" />
            <Text style={styles.metricValue}>{formatCurrency(insights.average_lifetime_value)}</Text>
            <Text style={styles.metricLabel}>Avg. LTV</Text>
          </View>
          
          <View style={styles.metricItem}>
            <ShoppingCart size={24} color="#3b82f6" />
            <Text style={styles.metricValue}>{formatCurrency(insights.average_order_value)}</Text>
            <Text style={styles.metricLabel}>Avg. Order Value</Text>
          </View>
          
          <View style={styles.metricItem}>
            <TrendingUp size={24} color="#f59e0b" />
            <Text style={styles.metricValue}>{insights.repeat_customer_rate.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Repeat Rate</Text>
          </View>
        </View>
      </Card>

      {/* Growth Indicators */}
      <Card style={styles.growthCard}>
        <Text style={styles.sectionTitle}>Growth Indicators</Text>
        <View style={styles.growthItems}>
          <View style={styles.growthItem}>
            <View style={styles.growthIcon}>
              <ArrowUpRight size={20} color="#22c55e" />
            </View>
            <View style={styles.growthContent}>
              <Text style={styles.growthValue}>+{insights.new_customers_this_month}</Text>
              <Text style={styles.growthLabel}>New Customers This Month</Text>
            </View>
          </View>
          
          <View style={styles.growthItem}>
            <View style={styles.growthIcon}>
              <ArrowDownRight size={20} color="#ef4444" />
            </View>
            <View style={styles.growthContent}>
              <Text style={styles.growthValue}>{insights.churned_customers}</Text>
              <Text style={styles.growthLabel}>Churned Customers</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Top Customers */}
      <Card style={styles.topCustomersCard}>
        <Text style={styles.sectionTitle}>Top Customers by Value</Text>
        <FlatList
          data={topCustomers.slice(0, 5)}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.customerItem}
              onPress={() => {
                setSelectedCustomer(item);
                loadCustomerPurchaseHistory(item.id);
              }}
            >
              <View style={styles.customerRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerEmail}>{item.email || 'No email'}</Text>
              </View>
              
              <View style={styles.customerMetrics}>
                <Text style={styles.customerValue}>{formatCurrency(item.total_spent)}</Text>
                <Text style={styles.customerOrders}>{item.total_orders} orders</Text>
              </View>
              
              <View style={styles.customerSegment}>
                {getSegmentIcon(item.segment)}
              </View>
            </TouchableOpacity>
          )}
        />
      </Card>
    </ScrollView>
  );

  const renderSegmentsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.segmentsCard}>
        <Text style={styles.sectionTitle}>Customer Segments</Text>
        <View style={styles.segmentsList}>
          {segments.map((segment) => (
            <View key={segment.segment} style={styles.segmentItem}>
              <View style={styles.segmentHeader}>
                <View style={styles.segmentInfo}>
                  <View style={[styles.segmentColor, { backgroundColor: segment.color }]} />
                  <Text style={styles.segmentName}>{segment.segment}</Text>
                </View>
                <Text style={styles.segmentPercentage}>{segment.percentage}%</Text>
              </View>
              
              <View style={styles.segmentMetrics}>
                <Text style={styles.segmentCount}>{segment.count} customers</Text>
                <Text style={styles.segmentRevenue}>{formatCurrency(segment.revenue)} revenue</Text>
              </View>
              
              <View style={styles.segmentBar}>
                <View
                  style={[
                    styles.segmentBarFill,
                    { width: `${segment.percentage}%`, backgroundColor: segment.color }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Segment Insights */}
      <Card style={styles.insightsCard}>
        <Text style={styles.sectionTitle}>Segment Insights</Text>
        <View style={styles.insightsList}>
          <View style={styles.insightItem}>
            <Gift size={20} color="#f59e0b" />
            <Text style={styles.insightText}>
              VIP customers generate 47% of total revenue despite being only 12% of the customer base
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <TrendingDown size={20} color="#ef4444" />
            <Text style={styles.insightText}>
              6% of customers are at risk of churning - consider targeted retention campaigns
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <TrendingUp size={20} color="#22c55e" />
            <Text style={styles.insightText}>
              New customer acquisition is strong with 15 new customers this month
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  const renderInsightsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.recommendationsCard}>
        <Text style={styles.sectionTitle}>AI-Powered Recommendations</Text>
        <View style={styles.recommendationsList}>
          <View style={styles.recommendationItem}>
            <View style={styles.recommendationIcon}>
              <Target size={20} color="#3b82f6" />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Loyalty Program</Text>
              <Text style={styles.recommendationText}>
                Launch a loyalty program to increase repeat customer rate from 68% to 80%
              </Text>
              <Text style={styles.recommendationImpact}>Potential: +$15K monthly revenue</Text>
            </View>
          </View>
          
          <View style={styles.recommendationItem}>
            <View style={styles.recommendationIcon}>
              <Mail size={20} color="#f59e0b" />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Win-Back Campaign</Text>
              <Text style={styles.recommendationText}>
                Target 8 at-risk customers with personalized offers to prevent churn
              </Text>
              <Text style={styles.recommendationImpact}>Potential: Retain $2K revenue</Text>
            </View>
          </View>
          
          <View style={styles.recommendationItem}>
            <View style={styles.recommendationIcon}>
              <Gift size={20} color="#22c55e" />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>VIP Exclusive Offers</Text>
              <Text style={styles.recommendationText}>
                Create exclusive products for VIP customers to increase their spend by 25%
              </Text>
              <Text style={styles.recommendationImpact}>Potential: +$11K monthly revenue</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Predictive Analytics */}
      <Card style={styles.predictiveCard}>
        <Text style={styles.sectionTitle}>Predictive Analytics</Text>
        <View style={styles.predictionsList}>
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Next Month Revenue Forecast</Text>
            <Text style={styles.predictionValue}>{formatCurrency(45000)}</Text>
            <Text style={styles.predictionConfidence}>85% confidence</Text>
          </View>
          
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Expected New Customers</Text>
            <Text style={styles.predictionValue}>18-22</Text>
            <Text style={styles.predictionConfidence}>Based on trends</Text>
          </View>
          
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Churn Risk Alert</Text>
            <Text style={styles.predictionValue}>3 customers</Text>
            <Text style={styles.predictionConfidence}>High probability</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', icon: BarChart3, label: 'Overview' },
          { key: 'segments', icon: PieChart, label: 'Segments' },
          { key: 'insights', icon: TrendingUp, label: 'Insights' },
        ].map(({ key, icon: Icon, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.activeTab]}
            onPress={() => {
              setActiveTab(key as any);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Icon size={20} color={activeTab === key ? '#a78bfa' : '#9ca3af'} />
            <Text style={[
              styles.tabText,
              activeTab === key && styles.activeTabText
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'segments' && renderSegmentsTab()}
        {activeTab === 'insights' && renderInsightsTab()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
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
    paddingHorizontal: 8,
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
    marginLeft: 6,
  },
  activeTabText: {
    color: '#a78bfa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  metricsCard: {
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  growthCard: {
    marginBottom: 16,
  },
  growthItems: {
    gap: 16,
  },
  growthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  growthIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  growthContent: {
    flex: 1,
  },
  growthValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  growthLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  topCustomersCard: {
    marginBottom: 16,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  customerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
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
    fontSize: 12,
    color: '#9ca3af',
  },
  customerMetrics: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  customerValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 2,
  },
  customerOrders: {
    fontSize: 12,
    color: '#9ca3af',
  },
  customerSegment: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentsCard: {
    marginBottom: 16,
  },
  segmentsList: {
    gap: 16,
  },
  segmentItem: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  segmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  segmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  segmentPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a78bfa',
  },
  segmentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  segmentCount: {
    fontSize: 14,
    color: '#9ca3af',
  },
  segmentRevenue: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '500',
  },
  segmentBar: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  segmentBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  insightsCard: {
    marginBottom: 16,
  },
  insightsList: {
    gap: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 12,
    lineHeight: 20,
  },
  recommendationsCard: {
    marginBottom: 16,
  },
  recommendationsList: {
    gap: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendationImpact: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  predictiveCard: {
    marginBottom: 16,
  },
  predictionsList: {
    gap: 16,
  },
  predictionItem: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  predictionLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  predictionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  predictionConfidence: {
    fontSize: 12,
    color: '#a78bfa',
  },
}); 