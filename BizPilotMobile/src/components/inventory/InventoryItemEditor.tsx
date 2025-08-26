import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Edit3,
  Save,
  X,
  Calendar,
  DollarSign,
  Package,
  MapPin,
  User,
  FileText,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import * as Haptics from 'expo-haptics';

interface InventoryItem {
  id: string;
  name: string;
  current_quantity: number;
  unit: string;
  low_stock_alert?: number;
  cost_per_unit: number;
  batch_lot_number?: string;
  expiration_date?: string;
  description?: string;
  supplier?: string;
  location?: string;
  min_order_quantity?: number;
  reorder_point?: number;
}

interface EditableFieldProps {
  label: string;
  value: string | number | undefined;
  fieldKey: keyof InventoryItem;
  item: InventoryItem;
  onUpdate: (fieldKey: keyof InventoryItem, newValue: string | number) => void;
  type?: 'text' | 'number' | 'date';
  icon?: React.ReactNode;
  placeholder?: string;
  multiline?: boolean;
}

interface InventoryItemEditorProps {
  item: InventoryItem;
  onUpdate: () => void;
  compact?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  fieldKey,
  item,
  onUpdate,
  type = 'text',
  icon,
  placeholder,
  multiline = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(true);
    if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(value?.toString() || '');
  };

  const handleSaveEdit = async () => {
    if (editValue === value?.toString()) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      let processedValue: string | number = editValue;

      // Type conversion based on field type
      if (type === 'number' && editValue.trim()) {
        const numValue = parseFloat(editValue);
        if (isNaN(numValue)) {
          Alert.alert('Invalid Value', 'Please enter a valid number');
          setLoading(false);
          return;
        }
        processedValue = numValue;
      } else if (type === 'date' && editValue.trim()) {
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(editValue)) {
          Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format');
          setLoading(false);
          return;
        }
      }

      await onUpdate(fieldKey, processedValue);
      setIsEditing(false);
      if (Platform.OS !== 'web' && (Haptics as any)?.notificationAsync) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
    } catch (error) {
      console.error('Error updating field:', error);
      Alert.alert('Error', 'Failed to update field');
    } finally {
      setLoading(false);
    }
  };

  const displayValue = () => {
    if (value === undefined || value === null || value === '') {
      return placeholder || 'Not set';
    }
    
    if (type === 'number' && typeof value === 'number') {
      return fieldKey === 'cost_per_unit' ? `$${value.toFixed(2)}` : value.toString();
    }
    
    if (type === 'date' && value) {
      return new Date(value.toString()).toLocaleDateString();
    }
    
    return value.toString();
  };

  const getKeyboardType = () => {
    if (type === 'number') {
      return 'decimal-pad';
    }
    return 'default';
  };

  if (isEditing) {
    return (
      <View style={styles.editingField}>
        <View style={styles.editingHeader}>
          <View style={styles.editingLabelContainer}>
            {icon}
            <Text style={styles.editingLabel}>{label}</Text>
          </View>
          <View style={styles.editingActions}>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
              <X size={16} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveEdit} style={styles.saveButton} disabled={loading}>
              <Save size={16} color={loading ? "#6b7280" : "#22c55e"} />
            </TouchableOpacity>
          </View>
        </View>
        
        <TextInput
          ref={inputRef}
          style={[styles.editingInput, multiline && styles.multilineInput]}
          value={editValue}
          onChangeText={setEditValue}
          keyboardType={getKeyboardType()}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          selectTextOnFocus
          onSubmitEditing={multiline ? undefined : handleSaveEdit}
          returnKeyType={multiline ? 'default' : 'done'}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.fieldContainer} onPress={handleStartEdit}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldLabelContainer}>
          {icon}
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>
        <Edit3 size={14} color="#9ca3af" />
      </View>
      
      <Text style={[
        styles.fieldValue,
        (!value || value === '') && styles.emptyFieldValue
      ]}>
        {displayValue()}
      </Text>
    </TouchableOpacity>
  );
};

export default function InventoryItemEditor({ item, onUpdate, compact = false }: InventoryItemEditorProps) {
  const { business } = useAuthStore();

  const updateField = async (fieldKey: keyof InventoryItem, newValue: string | number) => {
    try {
      await mcp_supabase_execute_sql({
        query: `
          UPDATE inventory 
          SET ${fieldKey} = $1, updated_at = $2
          WHERE id = $3 AND business_id = $4
        `,
        params: [newValue, new Date().toISOString(), item.id, business?.id]
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  };

  const renderBasicFields = () => (
    <>
      <EditableField
        label="Item Name"
        value={item.name}
        fieldKey="name"
        item={item}
        onUpdate={updateField}
        icon={<Package size={16} color="#a78bfa" />}
        placeholder="Enter item name"
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <EditableField
            label="Quantity"
            value={item.current_quantity}
            fieldKey="current_quantity"
            item={item}
            onUpdate={updateField}
            type="number"
            icon={<Package size={16} color="#a78bfa" />}
            placeholder="0"
          />
        </View>
        
        <View style={styles.halfField}>
          <EditableField
            label="Unit"
            value={item.unit}
            fieldKey="unit"
            item={item}
            onUpdate={updateField}
            icon={<Package size={16} color="#a78bfa" />}
            placeholder="unit, kg, L"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <EditableField
            label="Cost per Unit"
            value={item.cost_per_unit}
            fieldKey="cost_per_unit"
            item={item}
            onUpdate={updateField}
            type="number"
            icon={<DollarSign size={16} color="#a78bfa" />}
            placeholder="0.00"
          />
        </View>
        
        <View style={styles.halfField}>
          <EditableField
            label="Low Stock Alert"
            value={item.low_stock_alert}
            fieldKey="low_stock_alert"
            item={item}
            onUpdate={updateField}
            type="number"
            icon={<Package size={16} color="#a78bfa" />}
            placeholder="10"
          />
        </View>
      </View>
    </>
  );

  const renderAdvancedFields = () => (
    <>
      <EditableField
        label="Batch/Lot Number"
        value={item.batch_lot_number}
        fieldKey="batch_lot_number"
        item={item}
        onUpdate={updateField}
        icon={<FileText size={16} color="#a78bfa" />}
        placeholder="BATCH001"
      />

      <EditableField
        label="Expiration Date"
        value={item.expiration_date}
        fieldKey="expiration_date"
        item={item}
        onUpdate={updateField}
        type="date"
        icon={<Calendar size={16} color="#a78bfa" />}
        placeholder="YYYY-MM-DD"
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <EditableField
            label="Supplier"
            value={item.supplier}
            fieldKey="supplier"
            item={item}
            onUpdate={updateField}
            icon={<User size={16} color="#a78bfa" />}
            placeholder="Supplier name"
          />
        </View>
        
        <View style={styles.halfField}>
          <EditableField
            label="Location"
            value={item.location}
            fieldKey="location"
            item={item}
            onUpdate={updateField}
            icon={<MapPin size={16} color="#a78bfa" />}
            placeholder="Warehouse A"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <EditableField
            label="Min Order Qty"
            value={item.min_order_quantity}
            fieldKey="min_order_quantity"
            item={item}
            onUpdate={updateField}
            type="number"
            icon={<Package size={16} color="#a78bfa" />}
            placeholder="50"
          />
        </View>
        
        <View style={styles.halfField}>
          <EditableField
            label="Reorder Point"
            value={item.reorder_point}
            fieldKey="reorder_point"
            item={item}
            onUpdate={updateField}
            type="number"
            icon={<Package size={16} color="#a78bfa" />}
            placeholder="25"
          />
        </View>
      </View>

      <EditableField
        label="Description"
        value={item.description}
        fieldKey="description"
        item={item}
        onUpdate={updateField}
        icon={<FileText size={16} color="#a78bfa" />}
        placeholder="Item description"
        multiline
      />
    </>
  );

  if (compact) {
    return (
      <Card style={styles.compactCard}>
        {renderBasicFields()}
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        {renderBasicFields()}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Details</Text>
        {renderAdvancedFields()}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  compactCard: {
    padding: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  fieldContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    minHeight: 20,
  },
  emptyFieldValue: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  editingField: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#a78bfa',
  },
  editingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a78bfa',
  },
  editingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    padding: 4,
  },
  saveButton: {
    padding: 4,
  },
  editingInput: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#475569',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
}); 