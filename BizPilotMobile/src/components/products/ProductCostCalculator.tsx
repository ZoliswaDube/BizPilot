import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
} from 'react-native';
import {
  X,
  Plus,
  Minus,
  Calculator,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  Trash2,
  Save,
  Percent,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import * as Haptics from 'expo-haptics';

interface Ingredient {
  id: string;
  name: string;
  cost_per_unit: number;
  unit: string;
  supplier?: string;
}

interface ProductIngredient {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
}

interface LaborCost {
  id: string;
  description: string;
  hours: number;
  hourly_rate: number;
  total_cost: number;
}

interface CostCalculation {
  ingredients_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_cost: number;
  suggested_price: number;
  profit_margin: number;
  markup_percentage: number;
}

interface ProductCostCalculatorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (calculation: CostCalculation) => void;
  productId?: string;
  existingData?: any;
}

export default function ProductCostCalculator({
  visible,
  onClose,
  onSave,
  productId,
  existingData,
}: ProductCostCalculatorProps) {
  const { user, business } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'labor' | 'summary'>('ingredients');
  
  // Ingredients
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [productIngredients, setProductIngredients] = useState<ProductIngredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  
  // Labor
  const [laborCosts, setLaborCosts] = useState<LaborCost[]>([]);
  const [newLabor, setNewLabor] = useState({
    description: '',
    hours: '',
    hourly_rate: '25.00'
  });
  
  // Other costs
  const [overheadPercentage, setOverheadPercentage] = useState('15');
  const [targetProfitMargin, setTargetProfitMargin] = useState('30');
  const [businessHourlyRate, setBusinessHourlyRate] = useState(25.00);
  
  // Calculations
  const [costCalculation, setCostCalculation] = useState<CostCalculation>({
    ingredients_cost: 0,
    labor_cost: 0,
    overhead_cost: 0,
    total_cost: 0,
    suggested_price: 0,
    profit_margin: 0,
    markup_percentage: 0,
  });

  useEffect(() => {
    if (visible) {
      loadIngredients();
      loadBusinessSettings();
      if (existingData) {
        loadExistingData();
      }
    }
  }, [visible]);

  useEffect(() => {
    calculateCosts();
  }, [productIngredients, laborCosts, overheadPercentage, targetProfitMargin]);

  const loadIngredients = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT id, name, cost_per_unit, unit, supplier
          FROM ingredients 
          WHERE business_id = $1 
          ORDER BY name ASC
        `,
        params: [business?.id]
      });

      if (result.success) {
        setAvailableIngredients(result.data || []);
      }
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const loadBusinessSettings = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT hourly_rate 
          FROM business_settings 
          WHERE business_id = $1
        `,
        params: [business?.id]
      });

      if (result.success && result.data?.[0]) {
        const rate = result.data[0].hourly_rate || 25.00;
        setBusinessHourlyRate(rate);
        setNewLabor(prev => ({ ...prev, hourly_rate: rate.toString() }));
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
    }
  };

  const loadExistingData = () => {
    if (existingData?.ingredients) {
      setProductIngredients(existingData.ingredients);
    }
    if (existingData?.labor) {
      setLaborCosts(existingData.labor);
    }
    if (existingData?.overhead_percentage) {
      setOverheadPercentage(existingData.overhead_percentage.toString());
    }
    if (existingData?.target_margin) {
      setTargetProfitMargin(existingData.target_margin.toString());
    }
  };

  const addIngredient = (ingredient: Ingredient) => {
    const existing = productIngredients.find(pi => pi.ingredient_id === ingredient.id);
    
    if (existing) {
      Alert.alert('Already Added', 'This ingredient is already in the recipe');
      return;
    }

    const newProductIngredient: ProductIngredient = {
      id: `temp_${Date.now()}`,
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      quantity: 1,
      unit: ingredient.unit,
      cost_per_unit: ingredient.cost_per_unit,
      total_cost: ingredient.cost_per_unit,
    };

    setProductIngredients([...productIngredients, newProductIngredient]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const updateIngredientQuantity = (ingredientId: string, quantity: number) => {
    if (quantity <= 0) {
      removeIngredient(ingredientId);
      return;
    }

    setProductIngredients(ingredients =>
      ingredients.map(ing =>
        ing.ingredient_id === ingredientId
          ? { ...ing, quantity, total_cost: quantity * ing.cost_per_unit }
          : ing
      )
    );
  };

  const removeIngredient = (ingredientId: string) => {
    setProductIngredients(ingredients =>
      ingredients.filter(ing => ing.ingredient_id !== ingredientId)
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const addLaborCost = () => {
    if (!newLabor.description.trim() || !newLabor.hours) {
      Alert.alert('Error', 'Please fill in labor description and hours');
      return;
    }

    const hours = parseFloat(newLabor.hours);
    const rate = parseFloat(newLabor.hourly_rate);

    if (isNaN(hours) || isNaN(rate)) {
      Alert.alert('Error', 'Please enter valid numbers for hours and rate');
      return;
    }

    const laborItem: LaborCost = {
      id: `labor_${Date.now()}`,
      description: newLabor.description.trim(),
      hours,
      hourly_rate: rate,
      total_cost: hours * rate,
    };

    setLaborCosts([...laborCosts, laborItem]);
    setNewLabor({
      description: '',
      hours: '',
      hourly_rate: businessHourlyRate.toString()
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeLaborCost = (laborId: string) => {
    setLaborCosts(costs => costs.filter(cost => cost.id !== laborId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const calculateCosts = () => {
    const ingredientsCost = productIngredients.reduce((sum, ing) => sum + ing.total_cost, 0);
    const laborCost = laborCosts.reduce((sum, labor) => sum + labor.total_cost, 0);
    const overheadCost = (ingredientsCost + laborCost) * (parseFloat(overheadPercentage) / 100);
    const totalCost = ingredientsCost + laborCost + overheadCost;
    
    const targetMargin = parseFloat(targetProfitMargin) / 100;
    const suggestedPrice = totalCost / (1 - targetMargin);
    const actualMargin = ((suggestedPrice - totalCost) / suggestedPrice) * 100;
    const markupPercentage = ((suggestedPrice - totalCost) / totalCost) * 100;

    setCostCalculation({
      ingredients_cost: ingredientsCost,
      labor_cost: laborCost,
      overhead_cost: overheadCost,
      total_cost: totalCost,
      suggested_price: suggestedPrice,
      profit_margin: actualMargin,
      markup_percentage: markupPercentage,
    });
  };

  const saveCostCalculation = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (productId) {
        // Save to database
        await mcp_supabase_execute_sql({
          query: `
            INSERT INTO product_cost_calculations (
              product_id, business_id, ingredients_cost, labor_cost, overhead_cost,
              total_cost, suggested_price, profit_margin, overhead_percentage,
              target_margin, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (product_id) DO UPDATE SET
              ingredients_cost = $3, labor_cost = $4, overhead_cost = $5,
              total_cost = $6, suggested_price = $7, profit_margin = $8,
              overhead_percentage = $9, target_margin = $10,
              updated_at = $12
          `,
          params: [
            productId,
            business?.id,
            costCalculation.ingredients_cost,
            costCalculation.labor_cost,
            costCalculation.overhead_cost,
            costCalculation.total_cost,
            costCalculation.suggested_price,
            costCalculation.profit_margin,
            parseFloat(overheadPercentage),
            parseFloat(targetProfitMargin),
            user?.id,
            new Date().toISOString()
          ]
        });

        // Save ingredients
        for (const ingredient of productIngredients) {
          await mcp_supabase_execute_sql({
            query: `
              INSERT INTO product_ingredients (
                product_id, ingredient_id, quantity, cost_per_unit, total_cost
              ) VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (product_id, ingredient_id) DO UPDATE SET
                quantity = $3, cost_per_unit = $4, total_cost = $5
            `,
            params: [
              productId,
              ingredient.ingredient_id,
              ingredient.quantity,
              ingredient.cost_per_unit,
              ingredient.total_cost
            ]
          });
        }

        // Save labor costs
        for (const labor of laborCosts) {
          await mcp_supabase_execute_sql({
            query: `
              INSERT INTO product_labor_costs (
                product_id, description, hours, hourly_rate, total_cost
              ) VALUES ($1, $2, $3, $4, $5)
            `,
            params: [
              productId,
              labor.description,
              labor.hours,
              labor.hourly_rate,
              labor.total_cost
            ]
          });
        }
      }

      onSave(costCalculation);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Cost calculation saved successfully!');
      onClose();

    } catch (error) {
      console.error('Error saving cost calculation:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save cost calculation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  const renderIngredientsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Search */}
      <Input
        value={ingredientSearch}
        onChangeText={setIngredientSearch}
        placeholder="Search ingredients..."
        style={styles.searchInput}
      />

      {/* Available Ingredients */}
      <Text style={styles.sectionTitle}>Available Ingredients</Text>
      <View style={styles.ingredientsList}>
        {filteredIngredients.map(ingredient => (
          <TouchableOpacity
            key={ingredient.id}
            style={styles.ingredientItem}
            onPress={() => addIngredient(ingredient)}
          >
            <View style={styles.ingredientInfo}>
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              <Text style={styles.ingredientDetails}>
                {formatCurrency(ingredient.cost_per_unit)}/{ingredient.unit}
                {ingredient.supplier && ` • ${ingredient.supplier}`}
              </Text>
            </View>
            <Plus size={20} color="#a78bfa" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Recipe Ingredients */}
      {productIngredients.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recipe Ingredients</Text>
          <View style={styles.recipeIngredients}>
            {productIngredients.map(ingredient => (
              <Card key={ingredient.id} style={styles.recipeIngredientCard}>
                <View style={styles.recipeIngredientHeader}>
                  <Text style={styles.recipeIngredientName}>
                    {ingredient.ingredient_name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeIngredient(ingredient.ingredient_id)}
                    style={styles.removeButton}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.recipeIngredientControls}>
                  <TouchableOpacity
                    onPress={() => updateIngredientQuantity(
                      ingredient.ingredient_id, 
                      ingredient.quantity - 0.5
                    )}
                    style={styles.quantityButton}
                  >
                    <Minus size={16} color="#a78bfa" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>
                    {ingredient.quantity} {ingredient.unit}
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateIngredientQuantity(
                      ingredient.ingredient_id, 
                      ingredient.quantity + 0.5
                    )}
                    style={styles.quantityButton}
                  >
                    <Plus size={16} color="#a78bfa" />
                  </TouchableOpacity>
                  <Text style={styles.ingredientCost}>
                    {formatCurrency(ingredient.total_cost)}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderLaborTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Add Labor Cost */}
      <Card style={styles.laborForm}>
        <Text style={styles.sectionTitle}>Add Labor Cost</Text>
        
        <Input
          value={newLabor.description}
          onChangeText={(value) => setNewLabor(prev => ({ ...prev, description: value }))}
          placeholder="Labor description (e.g., Preparation, Cooking)"
          style={styles.laborInput}
        />
        
        <View style={styles.laborRow}>
          <Input
            value={newLabor.hours}
            onChangeText={(value) => setNewLabor(prev => ({ ...prev, hours: value }))}
            placeholder="Hours"
            keyboardType="decimal-pad"
            style={[styles.laborInput, styles.halfInput]}
          />
          <Input
            value={newLabor.hourly_rate}
            onChangeText={(value) => setNewLabor(prev => ({ ...prev, hourly_rate: value }))}
            placeholder="Rate/hour"
            keyboardType="decimal-pad"
            style={[styles.laborInput, styles.halfInput]}
          />
        </View>
        
        <Button
          title="Add Labor Cost"
          onPress={addLaborCost}
          style={styles.addLaborButton}
        />
      </Card>

      {/* Labor Costs List */}
      {laborCosts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Labor Costs</Text>
          <View style={styles.laborList}>
            {laborCosts.map(labor => (
              <Card key={labor.id} style={styles.laborItem}>
                <View style={styles.laborItemHeader}>
                  <Text style={styles.laborDescription}>{labor.description}</Text>
                  <TouchableOpacity
                    onPress={() => removeLaborCost(labor.id)}
                    style={styles.removeButton}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.laborItemDetails}>
                  <Text style={styles.laborDetails}>
                    {labor.hours}h × {formatCurrency(labor.hourly_rate)}/h
                  </Text>
                  <Text style={styles.laborCost}>
                    {formatCurrency(labor.total_cost)}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Cost Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Overhead Percentage</Text>
          <Input
            value={overheadPercentage}
            onChangeText={setOverheadPercentage}
            placeholder="15"
            keyboardType="decimal-pad"
            style={styles.settingInput}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Target Profit Margin (%)</Text>
          <Input
            value={targetProfitMargin}
            onChangeText={setTargetProfitMargin}
            placeholder="30"
            keyboardType="decimal-pad"
            style={styles.settingInput}
          />
        </View>
      </Card>
    </ScrollView>
  );

  const renderSummaryTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Cost Breakdown */}
      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Cost Breakdown</Text>
        
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Ingredients Cost:</Text>
          <Text style={styles.costValue}>
            {formatCurrency(costCalculation.ingredients_cost)}
          </Text>
        </View>
        
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Labor Cost:</Text>
          <Text style={styles.costValue}>
            {formatCurrency(costCalculation.labor_cost)}
          </Text>
        </View>
        
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Overhead ({overheadPercentage}%):</Text>
          <Text style={styles.costValue}>
            {formatCurrency(costCalculation.overhead_cost)}
          </Text>
        </View>
        
        <View style={[styles.costRow, styles.totalCostRow]}>
          <Text style={styles.totalCostLabel}>Total Cost:</Text>
          <Text style={styles.totalCostValue}>
            {formatCurrency(costCalculation.total_cost)}
          </Text>
        </View>
      </Card>

      {/* Pricing Suggestion */}
      <Card style={styles.pricingCard}>
        <Text style={styles.sectionTitle}>Pricing Analysis</Text>
        
        <View style={styles.pricingRow}>
          <TrendingUp size={24} color="#22c55e" />
          <View style={styles.pricingInfo}>
            <Text style={styles.pricingLabel}>Suggested Price</Text>
            <Text style={styles.suggestedPrice}>
              {formatCurrency(costCalculation.suggested_price)}
            </Text>
          </View>
        </View>
        
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Percent size={20} color="#a78bfa" />
            <Text style={styles.metricLabel}>Profit Margin</Text>
            <Text style={styles.metricValue}>
              {costCalculation.profit_margin.toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Calculator size={20} color="#f59e0b" />
            <Text style={styles.metricLabel}>Markup</Text>
            <Text style={styles.metricValue}>
              {costCalculation.markup_percentage.toFixed(1)}%
            </Text>
          </View>
        </View>
      </Card>

      {/* Save Button */}
      <Button
        title="Save Cost Calculation"
        onPress={saveCostCalculation}
        loading={loading}
        style={styles.saveButton}
      />
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#a78bfa" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cost Calculator</Text>
          <TouchableOpacity onPress={saveCostCalculation} style={styles.saveHeaderButton}>
            <Save size={24} color="#a78bfa" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {[
            { key: 'ingredients', icon: Package, label: 'Ingredients' },
            { key: 'labor', icon: Clock, label: 'Labor' },
            { key: 'summary', icon: Calculator, label: 'Summary' },
          ].map(({ key, icon: Icon, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && styles.activeTab]}
              onPress={() => {
                setActiveTab(key as any);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Icon size={20} color={activeTab === key ? '#a78bfa' : '#9ca3af'} />
              <Text style={[
                styles.tabText,
                activeTab === key && styles.activeTabText
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'ingredients' && renderIngredientsTab()}
        {activeTab === 'labor' && renderLaborTab()}
        {activeTab === 'summary' && renderSummaryTab()}
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
  saveHeaderButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
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
    marginLeft: 6,
  },
  activeTabText: {
    color: '#a78bfa',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchInput: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  ingredientsList: {
    marginBottom: 24,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1e293b',
    marginBottom: 8,
    borderRadius: 12,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  ingredientDetails: {
    fontSize: 14,
    color: '#9ca3af',
  },
  recipeIngredients: {
    marginBottom: 24,
  },
  recipeIngredientCard: {
    marginBottom: 12,
  },
  recipeIngredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeIngredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  recipeIngredientControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginHorizontal: 16,
    minWidth: 80,
    textAlign: 'center',
  },
  ingredientCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
    marginLeft: 'auto',
  },
  laborForm: {
    marginBottom: 24,
  },
  laborInput: {
    marginBottom: 12,
  },
  laborRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  addLaborButton: {
    marginTop: 8,
  },
  laborList: {
    marginBottom: 24,
  },
  laborItem: {
    marginBottom: 12,
  },
  laborItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  laborDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  laborItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  laborDetails: {
    fontSize: 14,
    color: '#9ca3af',
  },
  laborCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
  },
  settingsCard: {
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: '#d1d5db',
    flex: 1,
  },
  settingInput: {
    width: 100,
  },
  summaryCard: {
    marginBottom: 20,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  costValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  totalCostRow: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 8,
    paddingTop: 12,
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  totalCostValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
  },
  pricingCard: {
    marginBottom: 20,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pricingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  suggestedPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButton: {
    marginBottom: 20,
  },
}); 