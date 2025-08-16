import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Plus,
  Minus,
  Package,
  DollarSign,
  Hash,
  ChevronDown,
  Trash2,
  Copy,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { theme } from '../../styles/theme';
import * as Haptics from 'expo-haptics';

export interface Ingredient {
  id?: string;
  name: string;
  cost: number | string;
  quantity: number | string;
  unit: string;
}

interface IngredientManagerProps {
  ingredients: Ingredient[];
  onIngredientsChange: (ingredients: Ingredient[]) => void;
  allowDuplicates?: boolean;
  maxIngredients?: number;
  showCostSummary?: boolean;
  currency?: string;
}

const COMMON_UNITS = [
  'unit', 'kg', 'g', 'lb', 'oz', 'l', 'ml', 'cup', 'tbsp', 'tsp',
  'piece', 'dozen', 'box', 'bag', 'bottle', 'can', 'jar', 'packet'
];

const INGREDIENT_TEMPLATES = [
  { name: 'Flour', unit: 'kg', cost: '2.50' },
  { name: 'Sugar', unit: 'kg', cost: '3.00' },
  { name: 'Eggs', unit: 'dozen', cost: '4.00' },
  { name: 'Milk', unit: 'l', cost: '3.50' },
  { name: 'Butter', unit: 'kg', cost: '8.00' },
  { name: 'Salt', unit: 'kg', cost: '1.50' },
  { name: 'Vanilla Extract', unit: 'ml', cost: '0.50' },
  { name: 'Baking Powder', unit: 'g', cost: '0.10' },
];

export function IngredientManager({
  ingredients,
  onIngredientsChange,
  allowDuplicates = false,
  maxIngredients = 20,
  showCostSummary = true,
  currency = 'USD',
}: IngredientManagerProps) {
  const [showUnitSelector, setShowUnitSelector] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updatedIngredients = ingredients.map((ingredient, i) => {
      if (i === index) {
        return { ...ingredient, [field]: value };
      }
      return ingredient;
    });
    onIngredientsChange(updatedIngredients);
  };

  const addIngredient = (template?: Partial<Ingredient>) => {
    if (ingredients.length >= maxIngredients) {
      Alert.alert('Limit Reached', `You can add up to ${maxIngredients} ingredients.`);
      return;
    }

    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: template?.name || '',
      cost: template?.cost || '',
      quantity: '',
      unit: template?.unit || 'unit',
    };

    onIngredientsChange([...ingredients, newIngredient]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) {
      Alert.alert('Minimum Required', 'At least one ingredient is required.');
      return;
    }

    Alert.alert(
      'Remove Ingredient',
      'Are you sure you want to remove this ingredient?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedIngredients = ingredients.filter((_, i) => i !== index);
            onIngredientsChange(updatedIngredients);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          },
        },
      ]
    );
  };

  const duplicateIngredient = (index: number) => {
    if (ingredients.length >= maxIngredients) {
      Alert.alert('Limit Reached', `You can add up to ${maxIngredients} ingredients.`);
      return;
    }

    const ingredientToDuplicate = ingredients[index];
    const duplicatedIngredient: Ingredient = {
      ...ingredientToDuplicate,
      id: Date.now().toString(),
      name: `${ingredientToDuplicate.name} (Copy)`,
    };

    onIngredientsChange([...ingredients, duplicatedIngredient]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addTemplate = (template: Partial<Ingredient>) => {
    if (!allowDuplicates) {
      const exists = ingredients.some(ing => 
        ing.name.toLowerCase() === template.name?.toLowerCase()
      );
      
      if (exists) {
        Alert.alert('Duplicate Ingredient', 'This ingredient already exists in your list.');
        return;
      }
    }

    addIngredient(template);
    setShowTemplates(false);
  };

  const validateIngredient = (ingredient: Ingredient): boolean => {
    const cost = typeof ingredient.cost === 'number' ? ingredient.cost : parseFloat(ingredient.cost.toString());
    const quantity = typeof ingredient.quantity === 'number' ? ingredient.quantity : parseFloat(ingredient.quantity.toString());
    
    return ingredient.name.trim().length > 0 && cost > 0 && quantity > 0;
  };

  const getValidIngredients = (): Ingredient[] => {
    return ingredients.filter(validateIngredient);
  };

  const getTotalCost = (): number => {
    return getValidIngredients().reduce((total, ingredient) => {
      const cost = typeof ingredient.cost === 'number' ? ingredient.cost : parseFloat(ingredient.cost.toString()) || 0;
      const quantity = typeof ingredient.quantity === 'number' ? ingredient.quantity : parseFloat(ingredient.quantity.toString()) || 0;
      return total + (cost * quantity);
    }, 0);
  };

  const renderUnitSelector = (index: number) => {
    if (showUnitSelector !== index) return null;

    return (
      <View style={styles.unitSelector}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.unitList}
        >
          {COMMON_UNITS.map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.unitOption,
                ingredients[index].unit === unit && styles.unitOptionSelected
              ]}
              onPress={() => {
                updateIngredient(index, 'unit', unit);
                setShowUnitSelector(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[
                styles.unitOptionText,
                ingredients[index].unit === unit && styles.unitOptionTextSelected
              ]}>
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderIngredient = (ingredient: Ingredient, index: number) => (
    <Card key={ingredient.id || index} style={styles.ingredientCard}>
      <View style={styles.ingredientHeader}>
        <View style={styles.ingredientNumber}>
          <Text style={styles.ingredientNumberText}>{index + 1}</Text>
        </View>
        <Text style={styles.ingredientTitle}>Ingredient {index + 1}</Text>
        <View style={styles.ingredientActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => duplicateIngredient(index)}
          >
            <Copy size={16} color={theme.colors.blue[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => removeIngredient(index)}
          >
            <Trash2 size={16} color={theme.colors.red[500]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ingredientFields}>
        {/* Name Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Name *</Text>
          <Input
            value={ingredient.name}
            onChangeText={(value) => updateIngredient(index, 'name', value)}
            placeholder="Enter ingredient name"
            leftIcon={<Package size={16} color={theme.colors.gray[400]} />}
            style={styles.nameInput}
          />
        </View>

        {/* Cost and Quantity Row */}
        <View style={styles.rowFields}>
          <View style={[styles.fieldContainer, styles.halfField]}>
            <Text style={styles.fieldLabel}>Cost *</Text>
            <Input
              value={ingredient.cost.toString()}
              onChangeText={(value) => updateIngredient(index, 'cost', value)}
              placeholder="0.00"
              keyboardType="decimal-pad"
              leftIcon={<DollarSign size={16} color={theme.colors.gray[400]} />}
            />
          </View>

          <View style={[styles.fieldContainer, styles.halfField]}>
            <Text style={styles.fieldLabel}>Quantity *</Text>
            <Input
              value={ingredient.quantity.toString()}
              onChangeText={(value) => updateIngredient(index, 'quantity', value)}
              placeholder="0"
              keyboardType="decimal-pad"
              leftIcon={<Hash size={16} color={theme.colors.gray[400]} />}
            />
          </View>
        </View>

        {/* Unit Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Unit</Text>
          <TouchableOpacity
            style={styles.unitButton}
            onPress={() => {
              setShowUnitSelector(showUnitSelector === index ? null : index);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.unitButtonText}>{ingredient.unit}</Text>
            <ChevronDown size={16} color={theme.colors.gray[400]} />
          </TouchableOpacity>
        </View>

        {renderUnitSelector(index)}

        {/* Ingredient Cost Display */}
        {validateIngredient(ingredient) && (
          <View style={styles.ingredientCost}>
            <Text style={styles.ingredientCostLabel}>Total Cost:</Text>
            <Text style={styles.ingredientCostValue}>
              {formatCurrency(
                (typeof ingredient.cost === 'number' ? ingredient.cost : parseFloat(ingredient.cost.toString()) || 0) *
                (typeof ingredient.quantity === 'number' ? ingredient.quantity : parseFloat(ingredient.quantity.toString()) || 0)
              )}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ingredients</Text>
        <Text style={styles.subtitle}>
          {ingredients.length} of {maxIngredients} ingredients
        </Text>
      </View>

      {/* Ingredients List */}
      <ScrollView style={styles.ingredientsList} showsVerticalScrollIndicator={false}>
        {ingredients.map(renderIngredient)}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          variant="secondary"
          onPress={() => setShowTemplates(!showTemplates)}
          style={styles.templatesButton}
        >
          Use Template
        </Button>
        <Button
          variant="primary"
          onPress={() => addIngredient()}
          style={styles.addButton}
          disabled={ingredients.length >= maxIngredients}
        >
          <Plus size={16} color={theme.colors.white} />
          <Text style={styles.addButtonText}>Add Ingredient</Text>
        </Button>
      </View>

      {/* Templates */}
      {showTemplates && (
        <Card style={styles.templatesCard}>
          <Text style={styles.templatesTitle}>Common Ingredients</Text>
          <View style={styles.templatesList}>
            {INGREDIENT_TEMPLATES.map((template, index) => (
              <TouchableOpacity
                key={index}
                style={styles.templateItem}
                onPress={() => addTemplate(template)}
              >
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDetails}>
                  {formatCurrency(parseFloat(template.cost))} per {template.unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}

      {/* Cost Summary */}
      {showCostSummary && getValidIngredients().length > 0 && (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Material Cost Summary</Text>
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Valid Ingredients:</Text>
              <Text style={styles.summaryValue}>
                {getValidIngredients().length} of {ingredients.length}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Material Cost:</Text>
              <Text style={styles.totalValue}>{formatCurrency(getTotalCost())}</Text>
            </View>
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  ingredientsList: {
    flex: 1,
    marginBottom: theme.spacing.lg,
  },
  ingredientCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[800],
    borderColor: theme.colors.dark[600],
  },
  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  ingredientNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  ingredientNumberText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  ingredientTitle: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  ingredientActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.sm,
  },
  ingredientFields: {
    gap: theme.spacing.md,
  },
  fieldContainer: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[300],
  },
  nameInput: {
    fontSize: theme.fontSize.md,
  },
  rowFields: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfField: {
    flex: 1,
  },
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.dark[700],
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
  },
  unitButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.white,
  },
  unitSelector: {
    marginTop: theme.spacing.sm,
  },
  unitList: {
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  unitOption: {
    backgroundColor: theme.colors.dark[700],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
  },
  unitOptionSelected: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[500],
  },
  unitOptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[300],
  },
  unitOptionTextSelected: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
  ingredientCost: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.dark[700],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  ingredientCostLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  ingredientCostValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.green[400],
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  templatesButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  templatesCard: {
    backgroundColor: theme.colors.dark[800],
    borderColor: theme.colors.dark[600],
    marginBottom: theme.spacing.lg,
  },
  templatesTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  templatesList: {
    gap: theme.spacing.sm,
  },
  templateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.dark[700],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  templateName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  templateDetails: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  summaryCard: {
    backgroundColor: theme.colors.primary[950],
    borderColor: theme.colors.primary[800],
  },
  summaryHeader: {
    marginBottom: theme.spacing.md,
  },
  summaryTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary[300],
  },
  summaryContent: {
    gap: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[400],
  },
  summaryValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary[300],
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary[800],
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary[200],
  },
  totalValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary[100],
  },
}); 