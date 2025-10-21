import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  Linking,
} from 'react-native';
import {
  Truck,
  Plus,
  Edit3,
  Trash2,
  Search,
  Phone,
  Mail,
  MapPin,
  User,
  Grid,
  List,
  X,
  Save,
  Building,
  Contact,
} from 'lucide-react-native';
import { useAnalytics } from '../../hooks/useAnalytics';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { theme } from '../../styles/theme';
import * as Haptics from 'expo-haptics';

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

interface SupplierFormData {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  is_active: boolean;
}

type ViewMode = 'grid' | 'list';

export function SupplierManagement() {
  useAnalytics('Supplier Management');
  
  const { user } = useAuthStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    is_active: true,
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            s.*,
            COUNT(p.id) as product_count
          FROM suppliers s
          LEFT JOIN products p ON s.id = p.supplier_id
          WHERE s.business_id = $1
          GROUP BY s.id
          ORDER BY s.name ASC
        `,
        params: [user?.business_id || 'demo-business']
      });

      if (result.success && result.data) {
        setSuppliers(result.data);
      } else {
        // Mock data for development
        const mockSuppliers: Supplier[] = [
          {
            id: '1',
            name: 'Acme Food Supplies',
            contact_person: 'John Smith',
            email: 'john@acmefood.com',
            phone: '+1 (555) 123-4567',
            address: '123 Supply St, Food City, FC 12345',
            notes: 'Reliable supplier for organic ingredients',
            is_active: true,
            product_count: 15,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Premium Ingredients Co.',
            contact_person: 'Sarah Johnson',
            email: 'sarah@premiumingredients.com',
            phone: '+1 (555) 987-6543',
            address: '456 Quality Ave, Ingredient Town, IT 67890',
            notes: 'High-quality but expensive ingredients',
            is_active: true,
            product_count: 8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Budget Wholesale',
            contact_person: 'Mike Brown',
            email: 'mike@budgetwholesale.com',
            phone: '+1 (555) 456-7890',
            address: '789 Cheap Rd, Budget City, BC 54321',
            notes: 'Good for bulk orders, lower quality',
            is_active: false,
            product_count: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        setSuppliers(mockSuppliers);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    try {
      setSubmitLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        setError('Supplier name is required');
        return;
      }

      const result = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO suppliers (business_id, name, contact_person, email, phone, address, notes, is_active, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `,
        params: [
          user?.business_id || 'demo-business',
          formData.name.trim(),
          formData.contact_person.trim() || null,
          formData.email.trim() || null,
          formData.phone.trim() || null,
          formData.address.trim() || null,
          formData.notes.trim() || null,
          formData.is_active,
          user?.id || 'demo-user'
        ]
      });

      if (result.success) {
        await fetchSuppliers();
        resetForm();
        setShowModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        setError('Failed to create supplier');
      }
    } catch (err) {
      setError('Failed to create supplier');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return;

    try {
      setSubmitLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        setError('Supplier name is required');
        return;
      }

      const result = await mcp_supabase_execute_sql({
        query: `
          UPDATE suppliers 
          SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, notes = $6, is_active = $7, updated_at = now()
          WHERE id = $8 AND business_id = $9
        `,
        params: [
          formData.name.trim(),
          formData.contact_person.trim() || null,
          formData.email.trim() || null,
          formData.phone.trim() || null,
          formData.address.trim() || null,
          formData.notes.trim() || null,
          formData.is_active,
          editingSupplier.id,
          user?.business_id || 'demo-business'
        ]
      });

      if (result.success) {
        await fetchSuppliers();
        resetForm();
        setShowModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        setError('Failed to update supplier');
      }
    } catch (err) {
      setError('Failed to update supplier');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (supplier.product_count > 0) {
      Alert.alert(
        'Cannot Delete Supplier',
        `This supplier is associated with ${supplier.product_count} products. Please update the products first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await mcp_supabase_execute_sql({
                query: `DELETE FROM suppliers WHERE id = $1 AND business_id = $2`,
                params: [supplier.id, user?.business_id || 'demo-business']
              });

              if (result.success) {
                await fetchSuppliers();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete supplier');
            }
          },
        },
      ]
    );
  };

  const handleContactSupplier = async (supplier: Supplier, type: 'email' | 'phone') => {
    try {
      if (type === 'email' && supplier.email) {
        const url = `mailto:${supplier.email}?subject=Business Inquiry from BizPilot`;
        await Linking.openURL(url);
      } else if (type === 'phone' && supplier.phone) {
        const url = `tel:${supplier.phone}`;
        await Linking.openURL(url);
      } else {
        Alert.alert('No Contact Info', `No ${type} available for this supplier.`);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      Alert.alert('Error', `Failed to open ${type} app`);
    }
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      is_active: true,
    });
    setEditingSupplier(null);
    setError(null);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderSupplierCard = (supplier: Supplier) => (
    <Card key={supplier.id} style={styles.supplierCard}>
      <View style={styles.supplierHeader}>
        <View style={styles.supplierIcon}>
          <Truck size={24} color={theme.colors.blue[500]} />
        </View>
        <View style={styles.supplierInfo}>
          <Text style={styles.supplierName}>{supplier.name}</Text>
          <View style={styles.supplierMeta}>
            <View style={styles.productCount}>
              <Building size={12} color={theme.colors.gray[400]} />
              <Text style={styles.productCountText}>{supplier.product_count} products</Text>
            </View>
            <View style={[
              styles.statusBadge,
              supplier.is_active ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={[
                styles.statusText,
                supplier.is_active ? styles.activeText : styles.inactiveText
              ]}>
                {supplier.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.contactInfo}>
        {supplier.contact_person && (
          <View style={styles.contactRow}>
            <User size={14} color={theme.colors.gray[400]} />
            <Text style={styles.contactText}>{supplier.contact_person}</Text>
          </View>
        )}
        {supplier.email && (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleContactSupplier(supplier, 'email')}
          >
            <Mail size={14} color={theme.colors.blue[500]} />
            <Text style={[styles.contactText, styles.contactLink]}>{supplier.email}</Text>
          </TouchableOpacity>
        )}
        {supplier.phone && (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleContactSupplier(supplier, 'phone')}
          >
            <Phone size={14} color={theme.colors.green[500]} />
            <Text style={[styles.contactText, styles.contactLink]}>{supplier.phone}</Text>
          </TouchableOpacity>
        )}
        {supplier.address && (
          <View style={styles.contactRow}>
            <MapPin size={14} color={theme.colors.gray[400]} />
            <Text style={styles.contactText} numberOfLines={2}>{supplier.address}</Text>
          </View>
        )}
      </View>

      <View style={styles.supplierActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(supplier)}
        >
          <Edit3 size={16} color={theme.colors.yellow[500]} />
          <Text style={[styles.actionButtonText, { color: theme.colors.yellow[500] }]}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteSupplier(supplier)}
        >
          <Trash2 size={16} color={theme.colors.red[500]} />
          <Text style={[styles.actionButtonText, { color: theme.colors.red[500] }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderSupplierList = (supplier: Supplier) => (
    <Card key={supplier.id} style={styles.listItem}>
      <View style={styles.listHeader}>
        <View>
          <Text style={styles.listName}>{supplier.name}</Text>
          {supplier.contact_person && (
            <Text style={styles.listContact}>{supplier.contact_person}</Text>
          )}
        </View>
        <View style={styles.listActions}>
          <TouchableOpacity
            style={styles.listActionButton}
            onPress={() => openEditModal(supplier)}
          >
            <Edit3 size={18} color={theme.colors.yellow[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.listActionButton}
            onPress={() => handleDeleteSupplier(supplier)}
          >
            <Trash2 size={18} color={theme.colors.red[500]} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.listMeta}>
        <Text style={styles.listMetaText}>{supplier.product_count} products</Text>
        <View style={[
          styles.listStatusBadge,
          supplier.is_active ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={[
            styles.listStatusText,
            supplier.is_active ? styles.activeText : styles.inactiveText
          ]}>
            {supplier.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Suppliers</Text>
        <Text style={styles.subtitle}>Manage your supplier relationships</Text>
      </View>

      {/* Search and View Controls */}
      <Card style={styles.controlsCard}>
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search suppliers..."
          leftIcon={<Search size={16} color={theme.colors.gray[400]} />}
          style={styles.searchInput}
        />
        <View style={styles.controlsRow}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => {
                setViewMode('grid');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Grid size={16} color={viewMode === 'grid' ? theme.colors.white : theme.colors.gray[400]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => {
                setViewMode('list');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <List size={16} color={viewMode === 'list' ? theme.colors.white : theme.colors.gray[400]} />
            </TouchableOpacity>
          </View>
          <Button
            variant="primary"
            onPress={() => {
              resetForm();
              setShowModal(true);
            }}
            style={styles.addButton}
          >
            <Plus size={16} color={theme.colors.white} />
            <Text style={styles.addButtonText}>Add Supplier</Text>
          </Button>
        </View>
      </Card>

      {/* Suppliers List */}
      <ScrollView style={styles.suppliersList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading suppliers...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Button variant="secondary" onPress={fetchSuppliers} style={styles.retryButton}>
              Retry
            </Button>
          </Card>
        ) : filteredSuppliers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Contact size={48} color={theme.colors.gray[500]} />
            <Text style={styles.emptyTitle}>No Suppliers Found</Text>
            <Text style={styles.emptyDescription}>
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Add your first supplier to manage business relationships'
              }
            </Text>
            {!searchTerm && (
              <Button
                variant="primary"
                onPress={() => {
                  resetForm();
                  setShowModal(true);
                }}
                style={styles.emptyButton}
              >
                Add Supplier
              </Button>
            )}
          </Card>
        ) : (
          filteredSuppliers.map(viewMode === 'grid' ? renderSupplierCard : renderSupplierList)
        )}
      </ScrollView>

      {/* Supplier Form Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={24} color={theme.colors.gray[400]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Supplier Name *</Text>
              <Input
                value={formData.name}
                onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
                placeholder="Enter supplier name"
                autoFocus
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Contact Person</Text>
              <Input
                value={formData.contact_person}
                onChangeText={(value) => setFormData(prev => ({ ...prev, contact_person: value }))}
                placeholder="Enter contact person name"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Input
                value={formData.email}
                onChangeText={(value) => setFormData(prev => ({ ...prev, email: value }))}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Input
                value={formData.phone}
                onChangeText={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Address</Text>
              <Input
                value={formData.address}
                onChangeText={(value) => setFormData(prev => ({ ...prev, address: value }))}
                placeholder="Enter business address"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <Input
                value={formData.notes}
                onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                placeholder="Additional notes (optional)"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              <View style={styles.statusToggle}>
                <Text style={styles.fieldLabel}>Status</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    formData.is_active ? styles.toggleButtonActive : styles.toggleButtonInactive
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, is_active: !prev.is_active }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    formData.is_active ? styles.toggleTextActive : styles.toggleTextInactive
                  ]}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              variant="secondary"
              onPress={() => setShowModal(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}
              loading={submitLoading}
              style={styles.saveButton}
            >
              <Save size={16} color={theme.colors.white} />
              <Text style={styles.saveButtonText}>
                {editingSupplier ? 'Update' : 'Create'}
              </Text>
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
  },
  controlsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  searchInput: {
    marginBottom: theme.spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },
  viewButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  viewButtonActive: {
    backgroundColor: theme.colors.primary[600],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  addButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  suppliersList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  supplierCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  supplierIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.blue[950],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  supplierMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  productCountText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  activeBadge: {
    backgroundColor: theme.colors.green[950],
  },
  inactiveBadge: {
    backgroundColor: theme.colors.gray[800],
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  activeText: {
    color: theme.colors.green[400],
  },
  inactiveText: {
    color: theme.colors.gray[400],
  },
  contactInfo: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  contactText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    flex: 1,
  },
  contactLink: {
    color: theme.colors.blue[400],
  },
  supplierActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[700],
    paddingTop: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  listItem: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  listName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  listContact: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.xs,
  },
  listActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  listActionButton: {
    padding: theme.spacing.sm,
  },
  listMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listMetaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  listStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  listStatusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.red[950],
    borderColor: theme.colors.red[800],
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.red[400],
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.xl,
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
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[300],
    marginBottom: theme.spacing.sm,
  },
  statusToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.green[600],
    borderColor: theme.colors.green[500],
  },
  toggleButtonInactive: {
    backgroundColor: theme.colors.gray[700],
    borderColor: theme.colors.gray[600],
  },
  toggleButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  toggleTextActive: {
    color: theme.colors.white,
  },
  toggleTextInactive: {
    color: theme.colors.gray[400],
  },
  errorContainer: {
    backgroundColor: theme.colors.red[950],
    borderColor: theme.colors.red[800],
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[800],
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
}); 