import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Camera, 
  DollarSign, 
  TrendingUp, 
  PieChart,
  Receipt,
  Filter,
  BarChart3,
} from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import ExpenseCategorizationModal from '../../src/components/financial/ExpenseCategorizationModal';
import FinancialReports from '../../src/components/financial/FinancialReports';
import { mcp_supabase_execute_sql } from '../../src/services/mcpClient';
import { useAuthStore } from '../../src/store/auth';
import * as Haptics from 'expo-haptics';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category_name: string;
  date: string;
  vendor?: string;
  receipt_url?: string;
  created_at: string;
}

interface QuickStats {
  totalExpenses: number;
  monthlyAverage: number;
  largestExpense: number;
  categoriesCount: number;
}

export default function FinancialScreen() {
  const { business } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalExpenses: 0,
    monthlyAverage: 0,
    largestExpense: 0,
    categoriesCount: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadFinancialData();
  }, [business]);

  const loadFinancialData = async () => {
    if (!business?.id) return;

    try {
      await Promise.all([
        loadExpenses(),
        loadQuickStats(),
      ]);
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            e.id,
            e.description,
            e.amount,
            e.date,
            e.vendor,
            e.receipt_url,
            e.created_at,
            ec.name as category_name
          FROM expenses e
          LEFT JOIN expense_categories ec ON e.category_id = ec.id
          WHERE e.business_id = $1
          ORDER BY e.date DESC, e.created_at DESC
          LIMIT 50
        `,
        params: [business?.id]
      });

      if (result.success) {
        setExpenses(result.data || []);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadQuickStats = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const statsResult = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            COUNT(*) as total_count,
            SUM(amount) as total_amount,
            MAX(amount) as largest_expense,
            COUNT(DISTINCT category_id) as categories_count
          FROM expenses
          WHERE business_id = $1
          AND date >= $2
        `,
        params: [business?.id, `${currentMonth}-01`]
      });

      if (statsResult.success && statsResult.data?.[0]) {
        const data = statsResult.data[0];
        setQuickStats({
          totalExpenses: data.total_amount || 0,
          monthlyAverage: (data.total_amount || 0) / Math.max(1, data.total_count || 1),
          largestExpense: data.largest_expense || 0,
          categoriesCount: data.categories_count || 0,
        });
      }
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadFinancialData();
    setRefreshing(false);
  };

  const handleAddExpense = () => {
    setSelectedExpense(null);
    setShowExpenseModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowExpenseModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleExpenseCreated = () => {
    loadFinancialData();
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

  const renderOverviewTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Quick Stats */}
      <Card style={styles.statsCard}>
        <Text style={styles.cardTitle}>This Month</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <DollarSign size={24} color="#ef4444" />
            <Text style={styles.statValue}>{formatCurrency(quickStats.totalExpenses)}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
          <View style={styles.statItem}>
            <TrendingUp size={24} color="#a78bfa" />
            <Text style={styles.statValue}>{formatCurrency(quickStats.monthlyAverage)}</Text>
            <Text style={styles.statLabel}>Avg per Expense</Text>
          </View>
          <View style={styles.statItem}>
            <Receipt size={24} color="#10b981" />
            <Text style={styles.statValue}>{formatCurrency(quickStats.largestExpense)}</Text>
            <Text style={styles.statLabel}>Largest Expense</Text>
          </View>
          <View style={styles.statItem}>
            <PieChart size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{quickStats.categoriesCount}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
                     <Button
             title="Add Expense"
             onPress={handleAddExpense}
             style={styles.actionButton}
           />
           <Button
             title="Scan Receipt"
             onPress={handleAddExpense}
             variant="secondary"
             style={styles.actionButton}
           />
        </View>
      </Card>

      {/* Recent Expenses */}
      <Card style={styles.expensesCard}>
        <View style={styles.expensesHeader}>
          <Text style={styles.cardTitle}>Recent Expenses</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#a78bfa" />
          </TouchableOpacity>
        </View>

        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Receipt size={48} color="#6b7280" />
            <Text style={styles.emptyStateText}>No expenses yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first expense to start tracking
            </Text>
            <Button
              title="Add Expense"
              onPress={handleAddExpense}
              style={styles.emptyStateButton}
            />
          </View>
        ) : (
          <View style={styles.expensesList}>
            {expenses.slice(0, 10).map((expense) => (
              <TouchableOpacity
                key={expense.id}
                style={styles.expenseItem}
                onPress={() => handleEditExpense(expense)}
              >
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseCategory}>{expense.category_name}</Text>
                    {expense.vendor && (
                      <>
                        <Text style={styles.expenseSeparator}>•</Text>
                        <Text style={styles.expenseVendor}>{expense.vendor}</Text>
                      </>
                    )}
                  </View>
                  <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                </View>
                <View style={styles.expenseAmount}>
                  <Text style={styles.expenseAmountText}>
                    {formatCurrency(expense.amount)}
                  </Text>
                  {expense.receipt_url && (
                    <View style={styles.receiptIndicator}>
                      <Receipt size={12} color="#10b981" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderReportsTab = () => (
    <FinancialReports
      period={reportPeriod}
      onPeriodChange={setReportPeriod}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => {
            setActiveTab('overview');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <DollarSign size={20} color={activeTab === 'overview' ? '#a78bfa' : '#9ca3af'} />
          <Text style={[
            styles.tabText,
            activeTab === 'overview' && styles.activeTabText
          ]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => {
            setActiveTab('reports');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <BarChart3 size={20} color={activeTab === 'reports' ? '#a78bfa' : '#9ca3af'} />
          <Text style={[
            styles.tabText,
            activeTab === 'reports' && styles.activeTabText
          ]}>
            Reports
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' ? renderOverviewTab() : renderReportsTab()}

      {/* Expense Modal */}
      <ExpenseCategorizationModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onExpenseCreated={handleExpenseCreated}
        existingExpense={selectedExpense}
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
    paddingTop: 16,
    paddingBottom: 8,
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
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsCard: {
    marginTop: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  expensesCard: {
    marginBottom: 16,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    padding: 8,
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
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 32,
  },
  expensesList: {
    gap: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  expenseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#a78bfa',
  },
  expenseSeparator: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  expenseVendor: {
    fontSize: 14,
    color: '#9ca3af',
  },
  expenseDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  expenseAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  receiptIndicator: {
    padding: 2,
  },
  bottomSpacing: {
    height: 20,
  },
}); 