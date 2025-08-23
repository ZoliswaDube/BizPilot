import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  TrendingDown,
  Upload,
  Download,
  Edit3,
  BarChart3,
  CheckCircle,
  X,
} from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import BulkInventoryOperations from '../../src/components/inventory/BulkInventoryOperations';
import { mcp_supabase_execute_sql } from '../../src/services/mcpClient';
import { useAuthStore } from '../../src/store/auth';
import * as Haptics from 'expo-haptics';
import InventoryItemEditor from '../../src/components/inventory/InventoryItemEditor';

interface InventoryItem {
  id: string;
  name: string;
  current_quantity: number;
  unit: string;
  low_stock_alert?: number;
  cost_per_unit: number;
  updated_at?: string;
  product_id?: string;
  batch_lot_number?: string;
  expiration_date?: string;
  description?: string;
  supplier?: string;
  location?: string;
  min_order_quantity?: number;
  reorder_point?: number;
  image_url?: string;
}

interface InventoryStats {
  total_items: number;
  low_stock_items: number;
  total_value: number;
  recent_updates: number;
}

export default function InventoryScreen() {
  const { business } = useAuthStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total_items: 0,
    low_stock_items: 0,
    total_value: 0,
    recent_updates: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  useEffect(() => {
    loadInventoryData();
  }, [business]);

  const loadInventoryData = async () => {
    if (!business?.id) return;

    try {
      await Promise.all([
        loadInventoryItems(),
        loadInventoryStats(),
      ]);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    }
  };

  const loadInventoryItems = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            id, name, current_quantity, unit, low_stock_alert,
            cost_per_unit, updated_at, product_id, batch_lot_number,
            expiration_date, description, supplier, location,
            min_order_quantity, reorder_point, image_url
          FROM inventory 
          WHERE business_id = $1
          ORDER BY 
            CASE 
              WHEN low_stock_alert IS NOT NULL AND current_quantity <= low_stock_alert THEN 0
              ELSE 1 
            END,
            name ASC
        `,
        params: [business?.id]
      });

      if (result.success) {
        setInventory(result.data || []);
      }
    } catch (error) {
      console.error('Error loading inventory items:', error);
    }
  };

  const loadInventoryStats = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            COUNT(*) as total_items,
            SUM(CASE 
              WHEN low_stock_alert IS NOT NULL AND current_quantity <= low_stock_alert 
              THEN 1 ELSE 0 
            END) as low_stock_items,
            SUM(current_quantity * cost_per_unit) as total_value,
            COUNT(CASE 
              WHEN updated_at > NOW() - INTERVAL '7 days' 
              THEN 1 
            END) as recent_updates
          FROM inventory 
          WHERE business_id = $1
        `,
        params: [business?.id]
      });

      if (result.success && result.data?.[0]) {
        setStats({
          total_items: parseInt(result.data[0].total_items) || 0,
          low_stock_items: parseInt(result.data[0].low_stock_items) || 0,
          total_value: parseFloat(result.data[0].total_value) || 0,
          recent_updates: parseInt(result.data[0].recent_updates) || 0,
        });
      }
    } catch (error) {
      console.error('Error loading inventory stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadInventoryData();
    setRefreshing(false);
  };

  const handleInventoryUpdated = () => {
    loadInventoryData();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getFilteredInventory = () => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !filterLocation || item.location?.includes(filterLocation);
      const matchesSupplier = !filterSupplier || item.supplier?.includes(filterSupplier);
      const matchesLowStock = !showLowStockOnly || 
                             (item.low_stock_alert && item.current_quantity <= item.low_stock_alert);

      return matchesSearch && matchesLocation && matchesSupplier && matchesLowStock;
    });
  };

  const isLowStock = (item: InventoryItem): boolean => {
    return item.low_stock_alert ? item.current_quantity <= item.low_stock_alert : false;
  };

  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.cardTitle}>Inventory Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Package size={24} color="#a78bfa" />
          <Text style={styles.statValue}>{stats.total_items}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        
        <View style={styles.statItem}>
          <AlertTriangle size={24} color="#ef4444" />
          <Text style={styles.statValue}>{stats.low_stock_items}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        
        <View style={styles.statItem}>
          <TrendingDown size={24} color="#22c55e" />
          <Text style={styles.statValue}>{formatCurrency(stats.total_value)}</Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
        
        <View style={styles.statItem}>
          <BarChart3 size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.recent_updates}</Text>
          <Text style={styles.statLabel}>Recent Updates</Text>
        </View>
      </View>
    </Card>
  );

  const renderQuickActions = () => (
    <Card style={styles.actionsCard}>
      <Text style={styles.cardTitle}>Quick Actions</Text>
      <View style={styles.actionButtons}>
        <Button
          title="Bulk Operations"
          onPress={() => {
            setShowBulkOperations(true);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
          style={styles.actionButton}
        />
        <Button
          title="Add Item"
          onPress={() => {
            setShowAddItemModal(true);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
          variant="secondary"
          style={styles.actionButton}
        />
      </View>
      
      <View style={styles.bulkActionButtons}>
        <TouchableOpacity
          style={styles.bulkActionButton}
          onPress={() => setShowBulkOperations(true)}
        >
          <Upload size={20} color="#a78bfa" />
          <Text style={styles.bulkActionText}>Import</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.bulkActionButton}
          onPress={() => setShowBulkOperations(true)}
        >
          <Download size={20} color="#a78bfa" />
          <Text style={styles.bulkActionText}>Export</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.bulkActionButton}
          onPress={() => setShowBulkOperations(true)}
        >
          <Edit3 size={20} color="#a78bfa" />
          <Text style={styles.bulkActionText}>Bulk Edit</Text>
        </TouchableOpacity>
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
          {showFilters ? <X size={20} color="#a78bfa" /> : <Filter size={20} color="#a78bfa" />}
        </TouchableOpacity>
      </View>

      <Input
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Search inventory..."
        style={styles.searchInput}
      />

      {showFilters && (
        <View style={styles.advancedFilters}>
          <View style={styles.filterRow}>
            <Input
              value={filterLocation}
              onChangeText={setFilterLocation}
              placeholder="Filter by location"
              style={styles.halfInput}
            />
            <Input
              value={filterSupplier}
              onChangeText={setFilterSupplier}
              placeholder="Filter by supplier"
              style={styles.halfInput}
            />
          </View>
          
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => {
              setShowLowStockOnly(!showLowStockOnly);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <View style={[styles.checkbox, showLowStockOnly && styles.checkedCheckbox]}>
              {showLowStockOnly && <CheckCircle size={16} color="#ffffff" />}
            </View>
            <Text style={styles.checkboxLabel}>Show only low stock items</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => (
    <View style={styles.inventoryItemContainer}>
      <InventoryItemEditor
        item={item}
        onUpdate={handleInventoryUpdated}
        compact={true}
      />
      
      {/* Additional item details */}
      <View style={styles.itemDetails}>
        {item.expiration_date && (
          <View style={styles.itemDetailRow}>
            <Text style={styles.itemDetailLabel}>Expires:</Text>
            <Text style={styles.itemDetailValue}>{formatDate(item.expiration_date)}</Text>
          </View>
        )}
        
        {item.reorder_point && item.current_quantity <= item.reorder_point && (
          <View style={styles.reorderAlert}>
            <AlertTriangle size={14} color="#f59e0b" />
            <Text style={styles.reorderText}>
              Reorder recommended (below {item.reorder_point} {item.unit})
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const filteredInventory = getFilteredInventory();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
      </View>

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
        {renderQuickActions()}

        {/* Filters */}
        {renderFilters()}

        {/* Inventory List */}
        <Card style={styles.inventoryCard}>
          <View style={styles.inventoryHeader}>
            <Text style={styles.cardTitle}>
              Inventory Items ({filteredInventory.length})
            </Text>
          </View>

          {filteredInventory.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color="#6b7280" />
              <Text style={styles.emptyStateText}>No inventory items found</Text>
              <Text style={styles.emptyStateSubtext}>
                {inventory.length === 0 
                  ? 'Start by adding your first inventory item or importing from a file'
                  : 'Try adjusting your search or filter criteria'
                }
              </Text>
              {inventory.length === 0 && (
                <Button
                  title="Import from File"
                  onPress={() => setShowBulkOperations(true)}
                  style={styles.emptyStateButton}
                />
              )}
            </View>
          ) : (
            <FlatList
              data={filteredInventory}
              keyExtractor={(item) => item.id}
              renderItem={renderInventoryItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />
          )}
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bulk Operations Modal */}
      <BulkInventoryOperations
        visible={showBulkOperations}
        onClose={() => setShowBulkOperations(false)}
        onInventoryUpdated={handleInventoryUpdated}
      />

      {/* Add Item Modal */}
      <AddInventoryItemModal
        visible={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onInventoryUpdated={handleInventoryUpdated}
      />
    </SafeAreaView>
  );
}

// Add Inventory Item Modal Component
const AddInventoryItemModal = ({ visible, onClose, onInventoryUpdated }: {
  visible: boolean;
  onClose: () => void;
  onInventoryUpdated: () => void;
}) => {
  const { business, user } = useAuthStore();
  const [name, setName] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [supplier, setSupplier] = useState('');
  const [batchLotNumber, setBatchLotNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !currentQuantity || !unit.trim()) {
      Alert.alert('Error', 'Please fill in required fields (name, quantity, unit)');
      return;
    }

    if (!business?.id || !user?.id) {
      Alert.alert('Error', 'Missing business or user information');
      return;
    }

    setLoading(true);
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO inventory (
            business_id, name, current_quantity, unit, cost_per_unit,
            low_stock_alert, description, location, supplier, 
            batch_lot_number, expiration_date, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `,
        params: [
          business.id,
          name.trim(),
          parseFloat(currentQuantity),
          unit.trim(),
          costPerUnit ? parseFloat(costPerUnit) : null,
          lowStockAlert ? parseFloat(lowStockAlert) : null,
          description.trim() || null,
          location.trim() || null,
          supplier.trim() || null,
          batchLotNumber.trim() || null,
          expirationDate || null,
          user.id
        ]
      });

      if (result.success) {
        Alert.alert('Success', 'Inventory item added successfully');
        onClose();
        onInventoryUpdated();
        
        // Reset form
        setName('');
        setCurrentQuantity('');
        setUnit('');
        setCostPerUnit('');
        setLowStockAlert('');
        setDescription('');
        setLocation('');
        setSupplier('');
        setBatchLotNumber('');
        setExpirationDate('');
      } else {
        throw new Error(result.error || 'Failed to add inventory item');
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
      Alert.alert('Error', 'Failed to add inventory item. Please try again.');
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
          <Text style={styles.modalTitle}>Add Inventory Item</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Item name *"
            style={styles.modalInput}
          />

          <View style={styles.inputRow}>
            <Input
              value={currentQuantity}
              onChangeText={setCurrentQuantity}
              placeholder="Quantity *"
              keyboardType="decimal-pad"
              style={[styles.modalInput, styles.halfInput]}
            />
            <Input
              value={unit}
              onChangeText={setUnit}
              placeholder="Unit (kg, pcs) *"
              style={[styles.modalInput, styles.halfInput]}
            />
          </View>

          <View style={styles.inputRow}>
            <Input
              value={costPerUnit}
              onChangeText={setCostPerUnit}
              placeholder="Cost per unit"
              keyboardType="decimal-pad"
              style={[styles.modalInput, styles.halfInput]}
            />
            <Input
              value={lowStockAlert}
              onChangeText={setLowStockAlert}
              placeholder="Low stock alert"
              keyboardType="decimal-pad"
              style={[styles.modalInput, styles.halfInput]}
            />
          </View>

          <Input
            value={location}
            onChangeText={setLocation}
            placeholder="Storage location"
            style={styles.modalInput}
          />

          <Input
            value={supplier}
            onChangeText={setSupplier}
            placeholder="Supplier"
            style={styles.modalInput}
          />

          <Input
            value={batchLotNumber}
            onChangeText={setBatchLotNumber}
            placeholder="Batch/Lot number"
            style={styles.modalInput}
          />

          <Input
            value={expirationDate}
            onChangeText={setExpirationDate}
            placeholder="Expiration date (YYYY-MM-DD)"
            style={styles.modalInput}
          />

          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />
        </ScrollView>

        <View style={styles.modalActions}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onClose}
            style={styles.modalCancelButton}
          />
          <Button
            title="Add Item"
            onPress={handleCreate}
            loading={loading}
            disabled={!name.trim() || !currentQuantity || !unit.trim()}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsCard: {
    marginTop: 20,
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
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  bulkActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    gap: 8,
  },
  bulkActionText: {
    fontSize: 12,
    color: '#d1d5db',
    fontWeight: '500',
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
  advancedFilters: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9ca3af',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  inventoryCard: {
    marginBottom: 16,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inventoryItemContainer: {
    marginBottom: 12,
  },
  inventoryItem: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  itemSeparator: {
    height: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemNameSection: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  batchNumber: {
    fontSize: 12,
    color: '#9ca3af',
  },
  itemQuantitySection: {
    alignItems: 'flex-end',
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  lowStockBadge: {
    backgroundColor: '#ef444420',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  lowStockText: {
    color: '#ef4444',
  },
  itemDetails: {
    gap: 6,
    marginTop: 8,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetailLabel: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
  },
  itemDetailValue: {
    fontSize: 12,
    color: '#d1d5db',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  reorderAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b20',
    padding: 8,
    borderRadius: 6,
    gap: 6,
    marginTop: 8,
  },
  reorderText: {
    fontSize: 12,
    color: '#f59e0b',
    flex: 1,
  },
  itemDescription: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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