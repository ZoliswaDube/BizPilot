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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Camera, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  Receipt,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { theme } from '../../src/styles/theme';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receipt_url?: string;
  created_at: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyGrowth: number;
}

// Mock data for demo
const mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Office Supplies',
    amount: 150.00,
    category: 'Office',
    date: '2024-01-15',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    description: 'Marketing Campaign',
    amount: 500.00,
    category: 'Marketing',
    date: '2024-01-14',
    created_at: '2024-01-14T15:30:00Z',
  },
  {
    id: '3',
    description: 'Software Subscription',
    amount: 99.00,
    category: 'Software',
    date: '2024-01-13',
    created_at: '2024-01-13T09:15:00Z',
  },
];

const mockSummary: FinancialSummary = {
  totalRevenue: 12500.00,
  totalExpenses: 3200.00,
  netProfit: 9300.00,
  profitMargin: 74.4,
  monthlyGrowth: 12.5,
};

const expenseCategories = [
  'Office', 'Marketing', 'Software', 'Travel', 'Equipment', 
  'Utilities', 'Insurance', 'Professional Services', 'Other'
];

export default function FinancialScreen() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [summary, setSummary] = useState<FinancialSummary>(mockSummary);
  const [refreshing, setRefreshing] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAddExpense = (expenseData: any) => {
    const newExpense: Expense = {
      id: `expense_${Date.now()}`,
      ...expenseData,
      created_at: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
    
    // Update summary
    setSummary(prev => ({
      ...prev,
      totalExpenses: prev.totalExpenses + expenseData.amount,
      netProfit: prev.totalRevenue - (prev.totalExpenses + expenseData.amount),
    }));
  };

  const renderSummaryCard = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Financial Overview</Text>
        <TouchableOpacity style={styles.periodSelector}>
          <Text style={styles.periodText}>This {selectedPeriod}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryMetrics}>
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <TrendingUp size={20} color={theme.colors.green[500]} />
            <Text style={styles.metricLabel}>Revenue</Text>
          </View>
          <Text style={styles.metricValue}>${summary.totalRevenue.toLocaleString()}</Text>
          <View style={styles.metricChange}>
            <ArrowUpRight size={16} color={theme.colors.green[500]} />
            <Text style={[styles.changeText, { color: theme.colors.green[500] }]}>
              +{summary.monthlyGrowth}%
            </Text>
          </View>
        </View>

        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <TrendingDown size={20} color={theme.colors.red[500]} />
            <Text style={styles.metricLabel}>Expenses</Text>
          </View>
          <Text style={styles.metricValue}>${summary.totalExpenses.toLocaleString()}</Text>
        </View>

        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <DollarSign size={20} color={theme.colors.primary[500]} />
            <Text style={styles.metricLabel}>Net Profit</Text>
          </View>
          <Text style={styles.metricValue}>${summary.netProfit.toLocaleString()}</Text>
          <Text style={styles.marginText}>{summary.profitMargin}% margin</Text>
        </View>
      </View>
    </Card>
  );

  const renderExpenseCard = (expense: Expense) => (
    <Card key={expense.id} style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{expense.description}</Text>
          <Text style={styles.expenseCategory}>{expense.category}</Text>
        </View>
        <View style={styles.expenseAmount}>
          <Text style={styles.amountText}>${expense.amount.toFixed(2)}</Text>
          {expense.receipt_url && (
            <Receipt size={16} color={theme.colors.primary[500]} />
          )}
        </View>
      </View>
      <View style={styles.expenseFooter}>
        <Text style={styles.expenseDate}>
          {new Date(expense.date).toLocaleDateString()}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Financial</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={theme.colors.gray[400]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowExpenseModal(true)}
          >
            <Plus size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Summary */}
        {renderSummaryCard()}

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowExpenseModal(true)}
            >
              <Plus size={24} color={theme.colors.primary[500]} />
              <Text style={styles.actionButtonText}>Add Expense</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <PieChart size={24} color={theme.colors.primary[500]} />
              <Text style={styles.actionButtonText}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recent Expenses */}
        <View style={styles.expensesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {expenses.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Receipt size={48} color={theme.colors.gray[400]} />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>
                Add your first expense to start tracking
              </Text>
            </Card>
          ) : (
            expenses.map(renderExpenseCard)
          )}
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onAdd={handleAddExpense}
      />
    </SafeAreaView>
  );
}

// Add Expense Modal Component
const AddExpenseModal = ({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Office');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to capture receipts');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const handleAdd = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Valid amount is required');
      return;
    }

    onAdd({
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
      receipt_url: receiptImage,
    });

    // Reset form
    setDescription('');
    setAmount('');
    setCategory('Office');
    setDate(new Date().toISOString().split('T')[0]);
    setReceiptImage(null);
    onClose();
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
          <Text style={styles.modalTitle}>Add Expense</Text>
          <TouchableOpacity onPress={handleAdd}>
            <Text style={styles.modalSaveButton}>Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="What was this expense for?"
          />
          
          <Input
            label="Amount *"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            style={styles.modalInput}
          />

          <View style={styles.modalInput}>
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
              {expenseCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextActive
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Input
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            style={styles.modalInput}
          />

          {/* Receipt Section */}
          <View style={styles.receiptSection}>
            <Text style={styles.inputLabel}>Receipt (Optional)</Text>
            
            {receiptImage ? (
              <View style={styles.receiptPreview}>
                <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
                <TouchableOpacity
                  style={styles.removeReceiptButton}
                  onPress={() => setReceiptImage(null)}
                >
                  <Text style={styles.removeReceiptText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.receiptActions}>
                <Button
                  title="Take Photo"
                  variant="secondary"
                  onPress={handleTakePhoto}
                  style={styles.receiptButton}
                />
                <Button
                  title="Choose from Library"
                  variant="secondary"
                  onPress={handleSelectImage}
                  style={styles.receiptButton}
                />
              </View>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterButton: {
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.sm,
  },
  addButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  summaryCard: {
    marginBottom: theme.spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  summaryTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  periodSelector: {
    backgroundColor: theme.colors.dark[800],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  periodText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[300],
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  metricValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  changeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  marginText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[400],
    marginTop: 2,
  },
  actionsCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.lg,
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[300],
    marginTop: theme.spacing.sm,
  },
  expensesSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  viewAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[500],
  },
  expenseCard: {
    marginBottom: theme.spacing.sm,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  expenseCategory: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginTop: 2,
  },
  expenseAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  amountText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.red[500],
  },
  expenseFooter: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[700],
  },
  expenseDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
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
  },
  // Modal styles
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
    color: theme.colors.gray[400],
  },
  modalSaveButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary[500],
    fontWeight: theme.fontWeight.medium,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
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
  categorySelector: {
    marginTop: theme.spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.dark[800],
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary[600],
  },
  categoryButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[300],
  },
  categoryButtonTextActive: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
  receiptSection: {
    marginTop: theme.spacing.lg,
  },
  receiptActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  receiptButton: {
    flex: 1,
  },
  receiptPreview: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  receiptImage: {
    width: 200,
    height: 150,
    borderRadius: theme.borderRadius.lg,
  },
  removeReceiptButton: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  removeReceiptText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.red[500],
  },
}); 