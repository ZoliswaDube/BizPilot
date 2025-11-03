import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  FlatList,
} from 'react-native';
import {
  X,
  Camera,
  Upload,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  Save,
  Trash2,
  CheckCircle,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ExpenseData {
  amount: string;
  description: string;
  category_id: string;
  date: string;
  receipt_url?: string;
  vendor?: string;
  notes?: string;
}

interface ExpenseCategorizationModalProps {
  visible: boolean;
  onClose: () => void;
  onExpenseCreated: () => void;
  existingExpense?: any;
}

const defaultCategories: ExpenseCategory[] = [
  { id: 'office', name: 'Office Supplies', color: '#3b82f6', icon: 'briefcase' },
  { id: 'marketing', name: 'Marketing', color: '#10b981', icon: 'megaphone' },
  { id: 'travel', name: 'Travel', color: '#f59e0b', icon: 'plane' },
  { id: 'meals', name: 'Meals & Entertainment', color: '#ef4444', icon: 'utensils' },
  { id: 'utilities', name: 'Utilities', color: '#8b5cf6', icon: 'zap' },
  { id: 'software', name: 'Software & Tools', color: '#06b6d4', icon: 'monitor' },
  { id: 'equipment', name: 'Equipment', color: '#f97316', icon: 'hardware' },
  { id: 'other', name: 'Other', color: '#6b7280', icon: 'more-horizontal' },
];

export default function ExpenseCategorizationModal({
  visible,
  onClose,
  onExpenseCreated,
  existingExpense,
}: ExpenseCategorizationModalProps) {
  const { user, business } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>(defaultCategories);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  
  const [formData, setFormData] = useState<ExpenseData>({
    amount: '',
    description: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    notes: '',
  });

  useEffect(() => {
    if (visible) {
      loadCategories();
      if (existingExpense) {
        setFormData({
          amount: existingExpense.amount?.toString() || '',
          description: existingExpense.description || '',
          category_id: existingExpense.category_id || '',
          date: existingExpense.date?.split('T')[0] || new Date().toISOString().split('T')[0],
          vendor: existingExpense.vendor || '',
          notes: existingExpense.notes || '',
          receipt_url: existingExpense.receipt_url || '',
        });
        setReceiptImage(existingExpense.receipt_url || null);
      }
    }
  }, [visible, existingExpense]);

  const loadCategories = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT id, name, color, icon 
          FROM expense_categories 
          WHERE business_id = $1 OR business_id IS NULL
          ORDER BY name ASC
        `,
        params: [business?.id]
      });

      if (result.success && result.data?.length > 0) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (field: keyof ExpenseData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const captureReceipt = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to capture receipts');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setReceiptImage(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Process with mock OCR
        await processReceiptOCR(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture receipt');
    }
  };

  const uploadReceipt = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setReceiptImage(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Process with mock OCR
        await processReceiptOCR(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload receipt');
    }
  };

  const processReceiptOCR = async (imageUri: string) => {
    setOcrProcessing(true);
    
    try {
      // Mock OCR processing - in real implementation, integrate with OCR service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted data
      const mockExtractedData = {
        amount: '45.67',
        vendor: 'Office Depot',
        description: 'Office supplies - printer paper, pens',
        date: new Date().toISOString().split('T')[0],
      };

      setFormData(prev => ({
        ...prev,
        amount: mockExtractedData.amount,
        vendor: mockExtractedData.vendor,
        description: mockExtractedData.description,
        date: mockExtractedData.date,
        receipt_url: imageUri,
      }));

      // Auto-suggest category based on vendor/description
      const suggestedCategory = suggestCategory(mockExtractedData.vendor, mockExtractedData.description);
      if (suggestedCategory) {
        setFormData(prev => ({ ...prev, category_id: suggestedCategory.id }));
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('OCR Complete', 'Receipt information has been extracted and filled automatically!');
      
    } catch (error) {
      console.error('OCR processing error:', error);
      Alert.alert('OCR Failed', 'Could not extract information from receipt. Please enter manually.');
    } finally {
      setOcrProcessing(false);
    }
  };

  const suggestCategory = (vendor: string, description: string): ExpenseCategory | null => {
    const text = `${vendor} ${description}`.toLowerCase();
    
    if (text.includes('office') || text.includes('supplies') || text.includes('paper')) {
      return categories.find(c => c.id === 'office') || null;
    }
    if (text.includes('travel') || text.includes('uber') || text.includes('hotel')) {
      return categories.find(c => c.id === 'travel') || null;
    }
    if (text.includes('restaurant') || text.includes('food') || text.includes('coffee')) {
      return categories.find(c => c.id === 'meals') || null;
    }
    if (text.includes('software') || text.includes('subscription') || text.includes('app')) {
      return categories.find(c => c.id === 'software') || null;
    }
    
    return null;
  };

  const removeReceipt = () => {
    Alert.alert(
      'Remove Receipt',
      'Are you sure you want to remove this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setReceiptImage(null);
            setFormData(prev => ({ ...prev, receipt_url: undefined }));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
      ]
    );
  };

  const saveExpense = async () => {
    if (!formData.amount || !formData.description || !formData.category_id) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (!business?.id || !user?.id) {
      Alert.alert('Error', 'Business or user information not found');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const expenseData = {
        business_id: business.id,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category_id: formData.category_id,
        date: formData.date,
        vendor: formData.vendor,
        notes: formData.notes,
        receipt_url: formData.receipt_url,
        created_by: user.id,
        created_at: new Date().toISOString(),
      };

      if (existingExpense) {
        // Update existing expense
        await mcp_supabase_execute_sql({
          query: `
            UPDATE expenses 
            SET amount = $1, description = $2, category_id = $3, date = $4,
                vendor = $5, notes = $6, receipt_url = $7, updated_at = $8
            WHERE id = $9
          `,
          params: [
            expenseData.amount,
            expenseData.description,
            expenseData.category_id,
            expenseData.date,
            expenseData.vendor,
            expenseData.notes,
            expenseData.receipt_url,
            expenseData.created_at,
            existingExpense.id
          ]
        });
      } else {
        // Create new expense
        await mcp_supabase_execute_sql({
          query: `
            INSERT INTO expenses (
              business_id, amount, description, category_id, date, vendor, 
              notes, receipt_url, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `,
          params: [
            expenseData.business_id,
            expenseData.amount,
            expenseData.description,
            expenseData.category_id,
            expenseData.date,
            expenseData.vendor,
            expenseData.notes,
            expenseData.receipt_url,
            expenseData.created_by,
            expenseData.created_at
          ]
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Expense ${existingExpense ? 'updated' : 'created'} successfully!`);
      
      resetForm();
      onExpenseCreated();
      onClose();

    } catch (error) {
      console.error('Error saving expense:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      notes: '',
    });
    setReceiptImage(null);
  };

  const showReceiptOptions = () => {
    Alert.alert(
      'Add Receipt',
      'How would you like to add a receipt?',
      [
        { text: 'Take Photo', onPress: captureReceipt },
        { text: 'Upload from Gallery', onPress: uploadReceipt },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const selectedCategory = categories.find(c => c.id === formData.category_id);

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
          <Text style={styles.headerTitle}>
            {existingExpense ? 'Edit Expense' : 'Add Expense'}
          </Text>
          <TouchableOpacity onPress={saveExpense} disabled={loading} style={styles.saveButton}>
            <Save size={24} color={loading ? '#6b7280' : '#a78bfa'} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Receipt Section */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt</Text>
            
            {receiptImage ? (
              <View style={styles.receiptContainer}>
                <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
                <TouchableOpacity style={styles.removeReceiptButton} onPress={removeReceipt}>
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
                {ocrProcessing && (
                  <View style={styles.ocrOverlay}>
                    <Text style={styles.ocrText}>Processing OCR...</Text>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.receiptPlaceholder} onPress={showReceiptOptions}>
                <Camera size={32} color="#a78bfa" />
                <Text style={styles.receiptPlaceholderText}>Add Receipt</Text>
                <Text style={styles.receiptPlaceholderSubtext}>
                  Capture or upload for automatic data extraction
                </Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* Basic Information */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Expense Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <Input
                value={formData.amount}
                onChangeText={(value) => handleInputChange('amount', value)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                leftIcon={<DollarSign size={20} color="#a78bfa" />}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <Input
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="What was this expense for?"
                leftIcon={<FileText size={20} color="#a78bfa" />}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vendor</Text>
              <Input
                value={formData.vendor}
                onChangeText={(value) => handleInputChange('vendor', value)}
                placeholder="Where did you make this purchase?"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date *</Text>
              <Input
                value={formData.date}
                onChangeText={(value) => handleInputChange('date', value)}
                placeholder="YYYY-MM-DD"
                leftIcon={<Calendar size={20} color="#a78bfa" />}
                style={styles.input}
              />
            </View>
          </Card>

          {/* Category Selection */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Category *</Text>
            
            <FlatList
              data={categories}
              numColumns={2}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    formData.category_id === item.id && styles.selectedCategoryItem
                  ]}
                  onPress={() => handleInputChange('category_id', item.id)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
                    <Tag size={16} color={item.color} />
                  </View>
                  <Text style={styles.categoryText}>{item.name}</Text>
                  {formData.category_id === item.id && (
                    <CheckCircle size={16} color="#22c55e" style={styles.categoryCheck} />
                  )}
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          </Card>

          {/* Notes */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Input
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              placeholder="Any additional details..."
              multiline
              numberOfLines={3}
              style={styles.textareaInput}
            />
          </Card>

          {/* Save Button */}
          <Button
            title={existingExpense ? 'Update Expense' : 'Save Expense'}
            onPress={saveExpense}
            loading={loading}
            style={styles.saveButtonBottom}
          />

          <View style={styles.bottomSpacing} />
        </ScrollView>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  receiptContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  receiptImage: {
    width: 200,
    height: 250,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeReceiptButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef444420',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ocrOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#a78bfa90',
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  ocrText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  receiptPlaceholder: {
    height: 150,
    borderWidth: 2,
    borderColor: '#a78bfa',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#a78bfa10',
  },
  receiptPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 8,
  },
  receiptPlaceholderSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 8,
  },
  input: {
    marginBottom: 0,
  },
  textareaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    margin: 4,
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCategoryItem: {
    borderColor: '#a78bfa',
    backgroundColor: '#a78bfa20',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#ffffff',
    flex: 1,
  },
  categoryCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  saveButtonBottom: {
    marginTop: 24,
    marginBottom: 16,
  },
  bottomSpacing: {
    height: 20,
  },
}); 