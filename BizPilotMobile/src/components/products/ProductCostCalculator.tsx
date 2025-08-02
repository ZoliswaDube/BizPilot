import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calculator, TrendingUp, DollarSign, Target } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { theme } from '../../styles/theme';

export interface Ingredient {
  id?: string;
  name: string;
  cost: number;
  quantity: number;
  unit: string;
}

export interface ProductCalculation {
  materialCost: number;
  laborCost: number;
  totalCost: number;
  sellingPrice: number;
  profitMargin: number;
  profitAmount: number;
  costPerUnit: number;
  breakEvenQuantity: number;
}

interface ProductCostCalculatorProps {
  ingredients: Ingredient[];
  laborMinutes: number;
  hourlyRate: number;
  targetMargin: number;
  fixedCosts?: number;
  overhead?: number;
  markupStrategy?: 'margin' | 'markup';
  showAdvanced?: boolean;
}

export function ProductCostCalculator({
  ingredients,
  laborMinutes,
  hourlyRate,
  targetMargin,
  fixedCosts = 0,
  overhead = 0,
  markupStrategy = 'margin',
  showAdvanced = false,
}: ProductCostCalculatorProps) {
  
  const calculations = useMemo(() => {
    // Calculate material cost from ingredients
    const materialCost = ingredients.reduce((total, ingredient) => {
      const cost = typeof ingredient.cost === 'number' ? ingredient.cost : parseFloat(ingredient.cost.toString()) || 0;
      const quantity = typeof ingredient.quantity === 'number' ? ingredient.quantity : parseFloat(ingredient.quantity.toString()) || 0;
      return total + (cost * quantity);
    }, 0);

    // Calculate labor cost
    const laborCost = (laborMinutes / 60) * hourlyRate;

    // Calculate total direct cost
    const directCost = materialCost + laborCost;

    // Add overhead and fixed costs
    const totalCost = directCost + fixedCosts + overhead;

    // Calculate selling price based on margin strategy
    let sellingPrice: number;
    let profitMargin: number;

    if (markupStrategy === 'margin') {
      // Margin-based pricing: Price = Cost / (1 - Margin%)
      const marginDecimal = targetMargin / 100;
      sellingPrice = totalCost / (1 - marginDecimal);
      profitMargin = targetMargin;
    } else {
      // Markup-based pricing: Price = Cost * (1 + Markup%)
      const markupDecimal = targetMargin / 100;
      sellingPrice = totalCost * (1 + markupDecimal);
      profitMargin = ((sellingPrice - totalCost) / sellingPrice) * 100;
    }

    const profitAmount = sellingPrice - totalCost;
    const costPerUnit = totalCost;
    
    // Calculate break-even quantity (assuming fixed costs)
    const breakEvenQuantity = fixedCosts > 0 ? fixedCosts / (sellingPrice - (totalCost - fixedCosts)) : 1;

    return {
      materialCost,
      laborCost,
      totalCost,
      sellingPrice,
      profitMargin,
      profitAmount,
      costPerUnit,
      breakEvenQuantity,
    };
  }, [ingredients, laborMinutes, hourlyRate, targetMargin, fixedCosts, overhead, markupStrategy]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(1)}%`;
  };

  const getProfitabilityColor = (margin: number): string => {
    if (margin >= 50) return theme.colors.green[500];
    if (margin >= 30) return theme.colors.yellow[500];
    if (margin >= 15) return theme.colors.orange[500];
    return theme.colors.red[500];
  };

  const getEfficiencyRating = (margin: number): string => {
    if (margin >= 50) return 'Excellent';
    if (margin >= 30) return 'Good';
    if (margin >= 15) return 'Fair';
    return 'Poor';
  };

  return (
    <Card style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Calculator size={24} color={theme.colors.primary[500]} />
        </View>
        <Text style={styles.headerTitle}>Cost Analysis</Text>
        <View style={[styles.efficiencyBadge, { backgroundColor: `${getProfitabilityColor(calculations.profitMargin)}20` }]}>
          <Text style={[styles.efficiencyText, { color: getProfitabilityColor(calculations.profitMargin) }]}>
            {getEfficiencyRating(calculations.profitMargin)}
          </Text>
        </View>
      </View>

      {/* Cost Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cost Breakdown</Text>
        <View style={styles.breakdownList}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Material Cost</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(calculations.materialCost)}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Labor Cost ({laborMinutes} min)</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(calculations.laborCost)}</Text>
          </View>
          {fixedCosts > 0 && (
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Fixed Costs</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(fixedCosts)}</Text>
            </View>
          )}
          {overhead > 0 && (
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Overhead</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(overhead)}</Text>
            </View>
          )}
          <View style={[styles.breakdownItem, styles.totalCost]}>
            <Text style={styles.totalLabel}>Total Cost</Text>
            <Text style={styles.totalValue}>{formatCurrency(calculations.totalCost)}</Text>
          </View>
        </View>
      </View>

      {/* Pricing & Profitability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing & Profitability</Text>
        <View style={styles.pricingGrid}>
          <View style={styles.pricingCard}>
            <View style={styles.pricingIcon}>
              <DollarSign size={20} color={theme.colors.blue[500]} />
            </View>
            <Text style={styles.pricingLabel}>Selling Price</Text>
            <Text style={styles.pricingValue}>{formatCurrency(calculations.sellingPrice)}</Text>
          </View>
          <View style={styles.pricingCard}>
            <View style={styles.pricingIcon}>
              <TrendingUp size={20} color={getProfitabilityColor(calculations.profitMargin)} />
            </View>
            <Text style={styles.pricingLabel}>Profit Margin</Text>
            <Text style={[styles.pricingValue, { color: getProfitabilityColor(calculations.profitMargin) }]}>
              {formatPercentage(calculations.profitMargin)}
            </Text>
          </View>
          <View style={styles.pricingCard}>
            <View style={styles.pricingIcon}>
              <Target size={20} color={theme.colors.green[500]} />
            </View>
            <Text style={styles.pricingLabel}>Profit Amount</Text>
            <Text style={[styles.pricingValue, { color: theme.colors.green[500] }]}>
              {formatCurrency(calculations.profitAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Advanced Metrics */}
      {showAdvanced && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Metrics</Text>
          <View style={styles.advancedList}>
            <View style={styles.advancedItem}>
              <Text style={styles.advancedLabel}>Cost per Unit</Text>
              <Text style={styles.advancedValue}>{formatCurrency(calculations.costPerUnit)}</Text>
            </View>
            <View style={styles.advancedItem}>
              <Text style={styles.advancedLabel}>Break-even Quantity</Text>
              <Text style={styles.advancedValue}>{Math.ceil(calculations.breakEvenQuantity)} units</Text>
            </View>
            <View style={styles.advancedItem}>
              <Text style={styles.advancedLabel}>Markup Strategy</Text>
              <Text style={styles.advancedValue}>{markupStrategy === 'margin' ? 'Margin-based' : 'Markup-based'}</Text>
            </View>
            <View style={styles.advancedItem}>
              <Text style={styles.advancedLabel}>Labor Efficiency</Text>
              <Text style={styles.advancedValue}>{formatCurrency(calculations.laborCost / (laborMinutes / 60))}/hr</Text>
            </View>
          </View>
        </View>
      )}

      {/* Profitability Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={styles.insightsList}>
          {calculations.profitMargin < 15 && (
            <View style={[styles.insightItem, styles.warningInsight]}>
              <Text style={styles.insightText}>
                ⚠️ Low profit margin. Consider reducing costs or increasing price.
              </Text>
            </View>
          )}
          {calculations.laborCost > calculations.materialCost * 2 && (
            <View style={[styles.insightItem, styles.infoInsight]}>
              <Text style={styles.insightText}>
                💡 Labor cost is high relative to materials. Consider process optimization.
              </Text>
            </View>
          )}
          {calculations.profitMargin >= 50 && (
            <View style={[styles.insightItem, styles.successInsight]}>
              <Text style={styles.insightText}>
                ✅ Excellent profit margin! This product is highly profitable.
              </Text>
            </View>
          )}
          {ingredients.length === 0 && (
            <View style={[styles.insightItem, styles.warningInsight]}>
              <Text style={styles.insightText}>
                📝 Add ingredients to get accurate cost calculations.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[950],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  efficiencyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  efficiencyText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[300],
    marginBottom: theme.spacing.md,
  },
  breakdownList: {
    gap: theme.spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  breakdownLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  breakdownValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  totalCost: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[600],
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  totalValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  pricingGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  pricingIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.dark[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  pricingLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[400],
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  pricingValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    textAlign: 'center',
  },
  advancedList: {
    gap: theme.spacing.sm,
  },
  advancedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  advancedLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
  },
  advancedValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  insightsList: {
    gap: theme.spacing.sm,
  },
  insightItem: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  warningInsight: {
    backgroundColor: theme.colors.yellow[950],
    borderColor: theme.colors.yellow[800],
  },
  infoInsight: {
    backgroundColor: theme.colors.blue[950],
    borderColor: theme.colors.blue[800],
  },
  successInsight: {
    backgroundColor: theme.colors.green[950],
    borderColor: theme.colors.green[800],
  },
  insightText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[300],
    lineHeight: 20,
  },
});

// Export the calculation function for use in other components
export function calculateProduct(
  ingredients: Ingredient[],
  laborMinutes: number,
  hourlyRate: number,
  targetMargin: number,
  fixedCosts: number = 0,
  overhead: number = 0,
  markupStrategy: 'margin' | 'markup' = 'margin'
): ProductCalculation {
  // Calculate material cost
  const materialCost = ingredients.reduce((total, ingredient) => {
    const cost = typeof ingredient.cost === 'number' ? ingredient.cost : parseFloat(ingredient.cost.toString()) || 0;
    const quantity = typeof ingredient.quantity === 'number' ? ingredient.quantity : parseFloat(ingredient.quantity.toString()) || 0;
    return total + (cost * quantity);
  }, 0);

  // Calculate labor cost
  const laborCost = (laborMinutes / 60) * hourlyRate;

  // Calculate total cost
  const totalCost = materialCost + laborCost + fixedCosts + overhead;

  // Calculate selling price and margin
  let sellingPrice: number;
  let profitMargin: number;

  if (markupStrategy === 'margin') {
    const marginDecimal = targetMargin / 100;
    sellingPrice = totalCost / (1 - marginDecimal);
    profitMargin = targetMargin;
  } else {
    const markupDecimal = targetMargin / 100;
    sellingPrice = totalCost * (1 + markupDecimal);
    profitMargin = ((sellingPrice - totalCost) / sellingPrice) * 100;
  }

  const profitAmount = sellingPrice - totalCost;
  const costPerUnit = totalCost;
  const breakEvenQuantity = fixedCosts > 0 ? fixedCosts / (sellingPrice - (totalCost - fixedCosts)) : 1;

  return {
    materialCost,
    laborCost,
    totalCost,
    sellingPrice,
    profitMargin,
    profitAmount,
    costPerUnit,
    breakEvenQuantity,
  };
} 