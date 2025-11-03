import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import * as Haptics from 'expo-haptics';

interface FinancialData {
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyGrowth: number;
}

interface ExpenseByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface FinancialReportsProps {
  period: 'week' | 'month' | 'quarter' | 'year';
  onPeriodChange: (period: 'week' | 'month' | 'quarter' | 'year') => void;
}

const { width } = Dimensions.get('window');

export default function FinancialReports({ period, onPeriodChange }: FinancialReportsProps) {
  const { business } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData>({
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    profitMargin: 0,
    monthlyGrowth: 0,
  });
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyData[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, [period, business]);

  const loadFinancialData = async () => {
    if (!business?.id) return;

    setLoading(true);
    try {
      await Promise.all([
        loadProfitLossData(),
        loadExpensesByCategory(),
        loadMonthlyTrends(),
      ]);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfitLossData = async () => {
    try {
      const dateFilter = getDateFilter(period);
      
      // Load revenue from orders
      const revenueResult = await mcp_supabase_execute_sql({
        query: `
          SELECT COALESCE(SUM(total_amount), 0) as total_revenue
          FROM orders 
          WHERE business_id = $1 
          AND status IN ('delivered', 'completed')
          AND created_at >= $2
        `,
        params: [business?.id, dateFilter]
      });

      // Load expenses
      const expensesResult = await mcp_supabase_execute_sql({
        query: `
          SELECT COALESCE(SUM(amount), 0) as total_expenses
          FROM expenses 
          WHERE business_id = $1 
          AND date >= $2
        `,
        params: [business?.id, dateFilter]
      });

      const revenue = revenueResult.data?.[0]?.total_revenue || 0;
      const expenses = expensesResult.data?.[0]?.total_expenses || 0;
      const netProfit = revenue - expenses;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      // Calculate growth (mock calculation)
      const monthlyGrowth = Math.random() * 20 - 10; // -10% to +10%

      setFinancialData({
        revenue,
        expenses,
        netProfit,
        profitMargin,
        monthlyGrowth,
      });
    } catch (error) {
      console.error('Error loading P&L data:', error);
    }
  };

  const loadExpensesByCategory = async () => {
    try {
      const dateFilter = getDateFilter(period);
      
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            ec.name as category,
            SUM(e.amount) as amount
          FROM expenses e
          JOIN expense_categories ec ON e.category_id = ec.id
          WHERE e.business_id = $1 
          AND e.date >= $2
          GROUP BY ec.name, ec.color
          ORDER BY amount DESC
        `,
        params: [business?.id, dateFilter]
      });

      const totalExpenses = financialData.expenses || 1;
      const categoryColors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#06b6d4', '#f97316', '#6b7280'
      ];

      const expenseData: ExpenseByCategory[] = (result.data || []).map((item: any, index: number) => ({
        category: item.category,
        amount: item.amount,
        percentage: (item.amount / totalExpenses) * 100,
        color: categoryColors[index % categoryColors.length],
      }));

      setExpensesByCategory(expenseData);
    } catch (error) {
      console.error('Error loading expenses by category:', error);
    }
  };

  const loadMonthlyTrends = async () => {
    try {
      // Mock monthly trends data
      const mockTrends: MonthlyData[] = [
        { month: 'Jan', revenue: 8500, expenses: 2100, profit: 6400 },
        { month: 'Feb', revenue: 9200, expenses: 2300, profit: 6900 },
        { month: 'Mar', revenue: 10800, expenses: 2800, profit: 8000 },
        { month: 'Apr', revenue: 11500, expenses: 3100, profit: 8400 },
        { month: 'May', revenue: 12500, expenses: 3200, profit: 9300 },
        { month: 'Jun', revenue: 13200, expenses: 3400, profit: 9800 },
      ];

      setMonthlyTrends(mockTrends);
    } catch (error) {
      console.error('Error loading monthly trends:', error);
    }
  };

  const getDateFilter = (period: string): string => {
    const now = new Date();
    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return monthAgo.toISOString();
      case 'quarter':
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return quarterAgo.toISOString();
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return yearAgo.toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const exportReport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Mock export functionality
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1000);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodButton,
              period === p && styles.activePeriodButton
            ]}
            onPress={() => {
              onPeriodChange(p);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[
              styles.periodButtonText,
              period === p && styles.activePeriodButtonText
            ]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key Metrics */}
      <Card style={styles.metricsCard}>
        <View style={styles.metricsHeader}>
          <Text style={styles.cardTitle}>Financial Overview</Text>
          <TouchableOpacity onPress={exportReport} style={styles.exportButton}>
            <Download size={20} color="#a78bfa" />
          </TouchableOpacity>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <ArrowUpRight size={20} color="#22c55e" />
            </View>
            <Text style={styles.metricLabel}>Revenue</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(financialData.revenue)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <ArrowDownRight size={20} color="#ef4444" />
            </View>
            <Text style={styles.metricLabel}>Expenses</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(financialData.expenses)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <DollarSign size={20} color="#a78bfa" />
            </View>
            <Text style={styles.metricLabel}>Net Profit</Text>
            <Text style={[
              styles.metricValue,
              { color: financialData.netProfit >= 0 ? '#22c55e' : '#ef4444' }
            ]}>
              {formatCurrency(financialData.netProfit)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <TrendingUp size={20} color="#f59e0b" />
            </View>
            <Text style={styles.metricLabel}>Profit Margin</Text>
            <Text style={styles.metricValue}>
              {financialData.profitMargin.toFixed(1)}%
            </Text>
          </View>
        </View>
      </Card>

      {/* Expenses by Category */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <PieChart size={24} color="#a78bfa" />
          <Text style={styles.cardTitle}>Expenses by Category</Text>
        </View>

        <View style={styles.categoriesContainer}>
          {expensesByCategory.map((category, index) => (
            <View key={category.category} style={styles.categoryItem}>
              <View style={styles.categoryRow}>
                <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                <Text style={styles.categoryName}>{category.category}</Text>
                <Text style={styles.categoryAmount}>
                  {formatCurrency(category.amount)}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${category.percentage}%`,
                      backgroundColor: category.color 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.categoryPercentage}>
                {category.percentage.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Monthly Trends */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <BarChart3 size={24} color="#a78bfa" />
          <Text style={styles.cardTitle}>Monthly Trends</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.trendsContainer}>
            {monthlyTrends.map((month, index) => {
              const maxValue = Math.max(...monthlyTrends.map(m => m.revenue));
              const revenueHeight = (month.revenue / maxValue) * 100;
              const expenseHeight = (month.expenses / maxValue) * 100;
              
              return (
                <View key={month.month} style={styles.trendItem}>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.revenueBar,
                        { height: revenueHeight }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.expenseBar,
                        { height: expenseHeight }
                      ]} 
                    />
                  </View>
                  <Text style={styles.monthLabel}>{month.month}</Text>
                  <Text style={styles.profitValue}>
                    {formatCurrency(month.profit)}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>Revenue</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Expenses</Text>
          </View>
        </View>
      </Card>

      {/* Growth Indicator */}
      <Card style={styles.growthCard}>
        <View style={styles.growthContent}>
          <View style={styles.growthIcon}>
            {financialData.monthlyGrowth >= 0 ? (
              <TrendingUp size={32} color="#22c55e" />
            ) : (
              <TrendingDown size={32} color="#ef4444" />
            )}
          </View>
          <View style={styles.growthText}>
            <Text style={styles.growthLabel}>Monthly Growth</Text>
            <Text style={[
              styles.growthValue,
              { color: financialData.monthlyGrowth >= 0 ? '#22c55e' : '#ef4444' }
            ]}>
              {formatPercentage(financialData.monthlyGrowth)}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#a78bfa',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  activePeriodButtonText: {
    color: '#ffffff',
  },
  metricsCard: {
    marginBottom: 20,
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  exportButton: {
    padding: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: (width - 80) / 2,
    alignItems: 'center',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  chartCard: {
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoriesContainer: {
    gap: 16,
  },
  categoryItem: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginLeft: 24,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
  },
  trendsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 10,
  },
  trendItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 50,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 8,
  },
  revenueBar: {
    width: 12,
    backgroundColor: '#22c55e',
    borderRadius: 2,
    marginRight: 2,
  },
  expenseBar: {
    width: 12,
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  monthLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  profitValue: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  growthCard: {
    marginBottom: 20,
  },
  growthContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthIcon: {
    marginRight: 16,
  },
  growthText: {
    flex: 1,
  },
  growthLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  growthValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
}); 