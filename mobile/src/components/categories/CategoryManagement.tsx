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
} from 'react-native';
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Package,
  ChevronRight,
  X,
  Save,
  Folder,
  Hash,
} from 'lucide-react-native';
import { useAnalytics } from '../../hooks/useAnalytics';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { theme } from '../../styles/theme';
import * as Haptics from 'expo-haptics';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  is_active: boolean;
}

const CATEGORY_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#06B6D4', '#EAB308', '#D946EF', '#F43F5E', '#22C55E'
];

export function CategoryManagement() {
  useAnalytics('Category Management');
  
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: CATEGORY_COLORS[0],
    is_active: true,
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            c.*,
            COUNT(p.id) as product_count
          FROM categories c
          LEFT JOIN products p ON c.id = p.category_id
          WHERE c.business_id = $1
          GROUP BY c.id
          ORDER BY c.name ASC
        `,
        params: [user?.business_id || 'demo-business']
      });

      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        // Mock data for development
        const mockCategories: Category[] = [
          {
            id: '1',
            name: 'Beverages',
            description: 'Hot and cold drinks',
            color: '#3B82F6',
            is_active: true,
            product_count: 8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Pastries',
            description: 'Fresh baked goods',
            color: '#F59E0B',
            is_active: true,
            product_count: 12,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Sandwiches',
            description: 'Made to order sandwiches',
            color: '#10B981',
            is_active: true,
            product_count: 6,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '4',
            name: 'Desserts',
            description: 'Sweet treats and desserts',
            color: '#EC4899',
            is_active: false,
            product_count: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        setCategories(mockCategories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      setSubmitLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        setError('Category name is required');
        return;
      }

      const result = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO categories (business_id, name, description, color, is_active, created_by)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `,
        params: [
          user?.business_id || 'demo-business',
          formData.name.trim(),
          formData.description.trim() || null,
          formData.color,
          formData.is_active,
          user?.id || 'demo-user'
        ]
      });

      if (result.success) {
        await fetchCategories();
        resetForm();
        setShowModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        setError('Failed to create category');
      }
    } catch (err) {
      setError('Failed to create category');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      setSubmitLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        setError('Category name is required');
        return;
      }

      const result = await mcp_supabase_execute_sql({
        query: `
          UPDATE categories 
          SET name = $1, description = $2, color = $3, is_active = $4, updated_at = now()
          WHERE id = $5 AND business_id = $6
        `,
        params: [
          formData.name.trim(),
          formData.description.trim() || null,
          formData.color,
          formData.is_active,
          editingCategory.id,
          user?.business_id || 'demo-business'
        ]
      });

      if (result.success) {
        await fetchCategories();
        resetForm();
        setShowModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        setError('Failed to update category');
      }
    } catch (err) {
      setError('Failed to update category');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category.product_count > 0) {
      Alert.alert(
        'Cannot Delete Category',
        `This category contains ${category.product_count} products. Please move or delete the products first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await mcp_supabase_execute_sql({
                query: `DELETE FROM categories WHERE id = $1 AND business_id = $2`,
                params: [category.id, user?.business_id || 'demo-business']
              });

              if (result.success) {
                await fetchCategories();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          UPDATE categories 
          SET is_active = $1, updated_at = now()
          WHERE id = $2 AND business_id = $3
        `,
        params: [!category.is_active, category.id, user?.business_id || 'demo-business']
      });

      if (result.success) {
        await fetchCategories();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update category status');
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || CATEGORY_COLORS[0],
      is_active: category.is_active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: CATEGORY_COLORS[0],
      is_active: true,
    });
    setEditingCategory(null);
    setError(null);
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !showActiveOnly || category.is_active;
    return matchesSearch && matchesStatus;
  });

  const renderColorPicker = () => (
    <View style={styles.colorPicker}>
      <Text style={styles.fieldLabel}>Color</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorList}
      >
        {CATEGORY_COLORS.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              formData.color === color && styles.colorOptionSelected
            ]}
            onPress={() => {
              setFormData(prev => ({ ...prev, color }));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderCategoryItem = (category: Category) => (
    <Card key={category.id} style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{category.name}</Text>
          {category.description && (
            <Text style={styles.categoryDescription}>{category.description}</Text>
          )}
        </View>
        <View style={styles.categoryMeta}>
          <View style={styles.productCount}>
            <Package size={14} color={theme.colors.gray[400]} />
            <Text style={styles.productCountText}>{category.product_count}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            category.is_active ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={[
              styles.statusText,
              category.is_active ? styles.activeText : styles.inactiveText
            ]}>
              {category.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleStatus(category)}
        >
          <Text style={[styles.actionButtonText, { color: theme.colors.blue[500] }]}>
            {category.is_active ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(category)}
        >
          <Edit3 size={16} color={theme.colors.yellow[500]} />
          <Text style={[styles.actionButtonText, { color: theme.colors.yellow[500] }]}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteCategory(category)}
        >
          <Trash2 size={16} color={theme.colors.red[500]} />
          <Text style={[styles.actionButtonText, { color: theme.colors.red[500] }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>Organize your products</Text>
      </View>

      {/* Search and Filters */}
      <Card style={styles.searchCard}>
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search categories..."
          leftIcon={<Search size={16} color={theme.colors.gray[400]} />}
          style={styles.searchInput}
        />
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setShowActiveOnly(!showActiveOnly);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Filter size={16} color={theme.colors.gray[400]} />
            <Text style={styles.filterButtonText}>
              {showActiveOnly ? 'Active Only' : 'All Categories'}
            </Text>
          </TouchableOpacity>
          <Button
            variant="primary"
            onPress={() => {
              resetForm();
              setShowModal(true);
            }}
            style={styles.addButton}
          >
            <Plus size={16} color={theme.colors.white} />
            <Text style={styles.addButtonText}>Add Category</Text>
          </Button>
        </View>
      </Card>

      {/* Categories List */}
      <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Button variant="secondary" onPress={fetchCategories} style={styles.retryButton}>
              Retry
            </Button>
          </Card>
        ) : filteredCategories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Folder size={48} color={theme.colors.gray[500]} />
            <Text style={styles.emptyTitle}>No Categories Found</Text>
            <Text style={styles.emptyDescription}>
              {searchTerm || !showActiveOnly 
                ? 'Try adjusting your search or filters'
                : 'Create your first category to organize products'
              }
            </Text>
            {!searchTerm && showActiveOnly && (
              <Button
                variant="primary"
                onPress={() => {
                  resetForm();
                  setShowModal(true);
                }}
                style={styles.emptyButton}
              >
                Create Category
              </Button>
            )}
          </Card>
        ) : (
          filteredCategories.map(renderCategoryItem)
        )}
      </ScrollView>

      {/* Category Form Modal */}
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
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Name *</Text>
              <Input
                value={formData.name}
                onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
                placeholder="Enter category name"
                autoFocus
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Input
                value={formData.description}
                onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
                placeholder="Enter category description (optional)"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              {renderColorPicker()}
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
              onPress={editingCategory ? handleUpdateCategory : handleCreateCategory}
              loading={submitLoading}
              style={styles.saveButton}
            >
              <Save size={16} color={theme.colors.white} />
              <Text style={styles.saveButtonText}>
                {editingCategory ? 'Update' : 'Create'}
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
  searchCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  searchInput: {
    marginBottom: theme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  filterButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
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
  categoriesList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  categoryCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  categoryColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: theme.spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  categoryDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    lineHeight: 18,
  },
  categoryMeta: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
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
  categoryActions: {
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
  colorPicker: {
    gap: theme.spacing.sm,
  },
  colorList: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: theme.colors.white,
    borderWidth: 3,
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