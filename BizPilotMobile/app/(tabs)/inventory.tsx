import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  TrendingDown,
  AlertTriangle,
  Calendar,
  MapPin,
  BarChart3,
} from 'lucide-react-native';
import { useAnalytics } from '../../src/hooks/useAnalytics';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { theme } from '../../src/styles/theme';
import { mcp_supabase_execute_sql } from '../../src/services/mcpClient';

interface InventoryItem {
  id: string;
  name: string;
  current_quantity: number;
  unit: string;
  cost_per_unit: number;
  low_stock_alert: number;
  batch_lot_number?: string;
  expiration_date?: string;
  location?: string;
  supplier?: string;
  description?: string;
  total_value: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

export default function InventoryScreen() {
  useAnalytics('Inventory');
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Mock data for development
  const [mockInventory] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Coffee Beans - Premium Blend',
      current_quantity: 150,
      unit: 'kg',
      cost_per_unit: 25.00,
      low_stock_alert: 20,
      batch_lot_number: 'CB-2024-001',
      expiration_date: '2024-12-31',
      location: 'Warehouse A - Shelf 3',
      supplier: 'Coffee Suppliers Inc',
      description: 'High-quality Arabica coffee beans',
      total_value: 3750,
      status: 'in_stock',
    },
    {
      id: '2',
      name: 'Flour - Organic Wheat',
      current_quantity: 8,
      unit: 'kg',
      cost_per_unit: 12.50,
      low_stock_alert: 10,
      batch_lot_number: 'FL-2024-002',
      expiration_date: '2024-08-15',
      location: 'Storage Room B',
      supplier: 'Organic Grains Co',
      description: 'Certified organic wheat flour',
      total_value: 100,
      status: 'low_stock',
    },
    {
      id: '3',
      name: 'Sugar - Cane Sugar',
      current_quantity: 0,
      unit: 'kg',
      cost_per_unit: 3.20,
      low_stock_alert: 15,
      location: 'Pantry',
      supplier: 'Sweet Supply Co',
      description: 'Pure cane sugar for baking',
      total_value: 0,
      status: 'out_of_stock',
    },
    {
      id: '4',
      name: 'Milk - Whole Milk',
      current_quantity: 25,
      unit: 'L',
      cost_per_unit: 2.80,
      low_stock_alert: 10,
      batch_lot_number: 'ML-2024-003',
      expiration_date: '2024-02-15',
      location: 'Refrigerator 1',
      supplier: 'Dairy Fresh Ltd',
      description: 'Fresh whole milk',
      total_value: 70,
      status: 'expired',
    },
  ]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would fetch from Supabase via MCP
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            i.*,
            (i.current_quantity * i.cost_per_unit) as total_value,
            CASE 
              WHEN i.expiration_date < CURRENT_DATE THEN 'expired'
              WHEN i.current_quantity = 0 THEN 'out_of_stock'
              WHEN i.current_quantity <= i.low_stock_alert THEN 'low_stock'
              ELSE 'in_stock'
            END as status
          FROM inventory i
          ORDER BY i.name ASC
        `,
        params: []
      });

      if (result.success && result.data) {
        setInventory(result.data);
      } else {
        // Use mock data for development
        setInventory(mockInventory);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventory(mockInventory);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  const handleCreateItem = async (itemData: any) => {
    try {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        ...itemData,
        total_value: itemData.current_quantity * itemData.cost_per_unit,
        status: itemData.current_quantity <= itemData.low_stock_alert ? 'low_stock' : 'in_stock',
      };
      
      setInventory(prev => [newItem, ...prev]);
      setShowCreateModal(false);
      Alert.alert('Success', 'Inventory item created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create inventory item');
    }
  };

  const handleAdjustStock = async (itemId: string, adjustment: number, notes?: string) => {
    try {
      setInventory(prev => prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.current_quantity + adjustment);
          return {
            ...item,
            current_quantity: newQuantity,
            total_value: newQuantity * item.cost_per_unit,
            status: newQuantity === 0 ? 'out_of_stock' : 
                   newQuantity <= item.low_stock_alert ? 'low_stock' : 'in_stock',
          };
        }
        return item;
      }));
      
      setShowAdjustModal(false);
      setSelectedItem(null);
      Alert.alert('Success', 'Stock adjusted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to adjust stock');
    }
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setInventory(prev => prev.filter(item => item.id !== itemId));
            Alert.alert('Success', 'Item deleted successfully');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return theme.colors.green[500];
      case 'low_stock': return theme.colors.yellow[500];
      case 'out_of_stock': return theme.colors.red[500];
      case 'expired': return theme.colors.red[700];
      default: return theme.colors.gray[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return Package;
      case 'low_stock': return TrendingDown;
      case 'out_of_stock': case 'expired': return AlertTriangle;
      default: return Package;
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalValue = inventory.reduce((sum, item) => sum + item.total_value, 0);
  const lowStockCount = inventory.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock').length;

  const renderInventoryCard = (item: InventoryItem) => {
    const StatusIcon = getStatusIcon(item.status);
    
    return (
      <Card key={item.id} style={styles.inventoryCard}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemQuantity}>
                {item.current_quantity} {item.unit}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <StatusIcon size={12} color={theme.colors.white} />
                <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>
          </View>
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedItem(item);
                setShowAdjustModal(true);
              }}
            >
              <Edit size={16} color={theme.colors.primary[500]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteItem(item.id, item.name)}
            >
              <Trash2 size={16} color={theme.colors.red[500]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>${item.cost_per_unit.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Cost/Unit</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>${item.total_value.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Total Value</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{item.low_stock_alert}</Text>
            <Text style={styles.metricLabel}>Alert Level</Text>
          </View>
        </View>

        {(item.location || item.batch_lot_number || item.expiration_date) && (
          <View style={styles.itemExtras}>
            {item.location && (
              <View style={styles.extraItem}>
                <MapPin size={14} color={theme.colors.gray[400]} />
                <Text style={styles.extraText}>{item.location}</Text>
              </View>
            )}
            {item.batch_lot_number && (
              <Text style={styles.batchText}>Batch: {item.batch_lot_number}</Text>
            )}
            {item.expiration_date && (
              <View style={styles.extraItem}>
                <Calendar size={14} color={theme.colors.gray[400]} />
                <Text style={styles.extraText}>
                  Exp: {new Date(item.expiration_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={theme.colors.gray[400]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
            placeholderTextColor={theme.colors.gray[400]}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={theme.colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{inventory.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${totalValue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, lowStockCount > 0 && { color: theme.colors.red[500] }]}>
              {lowStockCount}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>
      </Card>

      {/* Filter Tabs */}
      <ScrollView horizontal style={styles.filterTabs} showsHorizontalScrollIndicator={false}>
        {['all', 'in_stock', 'low_stock', 'out_of_stock', 'expired'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, filterStatus === status && styles.activeFilterTab]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[
              styles.filterTabText,
              filterStatus === status && styles.activeFilterTabText
            ]}>
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Inventory List */}
      <ScrollView
        style={styles.inventoryList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredInventory.map(renderInventoryCard)}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {filteredInventory.length} of {inventory.length} items
          </Text>
        </View>
      </ScrollView>

      {/* Create Item Modal */}
      <CreateItemModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateItem}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustModal
        visible={showAdjustModal}
        item={selectedItem}
        onClose={() => {
          setShowAdjustModal(false);
          setSelectedItem(null);
        }}
        onAdjust={handleAdjustStock}
      />
    </SafeAreaView>
  );
}

// Create Item Modal Component
const CreateItemModal = ({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    current_quantity: '',
    unit: '',
    cost_per_unit: '',
    low_stock_alert: '',
    batch_lot_number: '',
    expiration_date: '',
    location: '',
    supplier: '',
    description: '',
  });

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.current_quantity || !formData.unit || !formData.cost_per_unit) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    onCreate({
      ...formData,
      name: formData.name.trim(),
      current_quantity: parseFloat(formData.current_quantity),
      cost_per_unit: parseFloat(formData.cost_per_unit),
      low_stock_alert: parseInt(formData.low_stock_alert) || 0,
    });

    // Reset form
    setFormData({
      name: '',
      current_quantity: '',
      unit: '',
      cost_per_unit: '',
      low_stock_alert: '',
      batch_lot_number: '',
      expiration_date: '',
      location: '',
      supplier: '',
      description: '',
    });
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
          <Text style={styles.modalTitle}>New Item</Text>
          <TouchableOpacity onPress={handleCreate}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            label="Item Name *"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter item name"
          />
          
          <View style={styles.row}>
            <Input
              label="Quantity *"
              value={formData.current_quantity}
              onChangeText={(text) => setFormData(prev => ({ ...prev, current_quantity: text }))}
              placeholder="0"
              keyboardType="decimal-pad"
              style={[styles.modalInput, { flex: 1, marginRight: theme.spacing.sm }]}
            />
            <Input
              label="Unit *"
              value={formData.unit}
              onChangeText={(text) => setFormData(prev => ({ ...prev, unit: text }))}
              placeholder="kg, L, pieces"
              style={[styles.modalInput, { flex: 1, marginLeft: theme.spacing.sm }]}
            />
          </View>
          
          <View style={styles.row}>
            <Input
              label="Cost per Unit *"
              value={formData.cost_per_unit}
              onChangeText={(text) => setFormData(prev => ({ ...prev, cost_per_unit: text }))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={[styles.modalInput, { flex: 1, marginRight: theme.spacing.sm }]}
            />
            <Input
              label="Low Stock Alert"
              value={formData.low_stock_alert}
              onChangeText={(text) => setFormData(prev => ({ ...prev, low_stock_alert: text }))}
              placeholder="0"
              keyboardType="numeric"
              style={[styles.modalInput, { flex: 1, marginLeft: theme.spacing.sm }]}
            />
          </View>
          
          <Input
            label="Location"
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="Storage location"
            style={styles.modalInput}
          />
          
          <Input
            label="Supplier"
            value={formData.supplier}
            onChangeText={(text) => setFormData(prev => ({ ...prev, supplier: text }))}
            placeholder="Supplier name"
            style={styles.modalInput}
          />
          
          <Input
            label="Batch/Lot Number"
            value={formData.batch_lot_number}
            onChangeText={(text) => setFormData(prev => ({ ...prev, batch_lot_number: text }))}
            placeholder="Batch or lot number"
            style={styles.modalInput}
          />
          
          <Input
            label="Expiration Date"
            value={formData.expiration_date}
            onChangeText={(text) => setFormData(prev => ({ ...prev, expiration_date: text }))}
            placeholder="YYYY-MM-DD"
            style={styles.modalInput}
          />
          
          <Input
            label="Description"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Item description"
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Stock Adjustment Modal Component
const StockAdjustModal = ({ visible, item, onClose, onAdjust }: {
  visible: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onAdjust: (itemId: string, adjustment: number, notes?: string) => void;
}) => {
  const [adjustment, setAdjustment] = useState('');
  const [notes, setNotes] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');

  const handleAdjust = () => {
    if (!item || !adjustment) {
      Alert.alert('Error', 'Please enter an adjustment amount');
      return;
    }

    const adjustmentValue = parseFloat(adjustment) * (adjustmentType === 'add' ? 1 : -1);
    onAdjust(item.id, adjustmentValue, notes.trim() || undefined);

    // Reset form
    setAdjustment('');
    setNotes('');
    setAdjustmentType('add');
  };

  if (!item) return null;

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
          <Text style={styles.modalTitle}>Adjust Stock</Text>
          <TouchableOpacity onPress={handleAdjust}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Card style={styles.itemSummary}>
            <Text style={styles.itemSummaryName}>{item.name}</Text>
            <Text style={styles.itemSummaryStock}>
              Current Stock: {item.current_quantity} {item.unit}
            </Text>
          </Card>

          <View style={styles.adjustmentTypeContainer}>
            <TouchableOpacity
              style={[
                styles.adjustmentTypeButton,
                adjustmentType === 'add' && styles.activeAdjustmentType
              ]}
              onPress={() => setAdjustmentType('add')}
            >
              <Text style={[
                styles.adjustmentTypeText,
                adjustmentType === 'add' && styles.activeAdjustmentTypeText
              ]}>
                Add Stock
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.adjustmentTypeButton,
                adjustmentType === 'subtract' && styles.activeAdjustmentType
              ]}
              onPress={() => setAdjustmentType('subtract')}
            >
              <Text style={[
                styles.adjustmentTypeText,
                adjustmentType === 'subtract' && styles.activeAdjustmentTypeText
              ]}>
                Remove Stock
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Adjustment Amount"
            value={adjustment}
            onChangeText={setAdjustment}
            placeholder="Enter amount"
            keyboardType="decimal-pad"
            style={styles.modalInput}
          />

          <Input
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Reason for adjustment"
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />

          {adjustment && (
            <Card style={styles.previewCard}>
              <Text style={styles.previewLabel}>New Stock Level:</Text>
              <Text style={styles.previewValue}>
                {Math.max(0, item.current_quantity + (parseFloat(adjustment) * (adjustmentType === 'add' ? 1 : -1)))} {item.unit}
              </Text>
            </Card>
          )}
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
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
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
  statsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.xs,
  },
  filterTabs: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  filterTab: {
    backgroundColor: theme.colors.dark[800],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.sm,
  },
  activeFilterTab: {
    backgroundColor: theme.colors.primary[600],
  },
  filterTabText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    textTransform: 'capitalize',
  },
  activeFilterTabText: {
    color: theme.colors.white,
  },
  inventoryList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  inventoryCard: {
    marginBottom: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  itemQuantity: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[300],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
  itemActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.sm,
  },
  itemMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[700],
    marginBottom: theme.spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  metricLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.xs,
  },
  itemExtras: {
    gap: theme.spacing.xs,
  },
  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  extraText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  batchText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark[800],
  },
  modalCancelButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  modalSaveButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary[500],
    fontWeight: theme.fontWeight.semibold,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  modalInput: {
    marginTop: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
  itemSummary: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  itemSummaryName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  itemSummaryStock: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[300],
  },
  adjustmentTypeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },
  adjustmentTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  activeAdjustmentType: {
    backgroundColor: theme.colors.primary[600],
  },
  adjustmentTypeText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
  },
  activeAdjustmentTypeText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
  previewCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary[900],
    borderColor: theme.colors.primary[700],
  },
  previewLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[300],
    marginBottom: theme.spacing.xs,
  },
  previewValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary[100],
  },
}); 