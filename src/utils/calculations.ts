export interface Ingredient {
  id?: string
  name: string
  cost: number
  quantity: number
  unit: string
}

export interface ProductCalculation {
  totalCost: number
  sellingPrice: number
  profitMargin: number
}

/**
 * Calculate the total cost of ingredients
 */
export function calculateIngredientCost(ingredients: Ingredient[]): number {
  return ingredients.reduce((total, ingredient) => {
    return total + (ingredient.cost * ingredient.quantity)
  }, 0)
}

/**
 * Calculate labor cost based on minutes and hourly rate
 */
export function calculateLaborCost(laborMinutes: number, hourlyRate: number): number {
  return (laborMinutes / 60) * hourlyRate
}

/**
 * Calculate total product cost (ingredients + labor)
 */
export function calculateTotalCost(
  ingredients: Ingredient[], 
  laborMinutes: number, 
  hourlyRate: number
): number {
  const ingredientCost = calculateIngredientCost(ingredients)
  const laborCost = calculateLaborCost(laborMinutes, hourlyRate)
  return ingredientCost + laborCost
}

/**
 * Calculate selling price based on total cost and margin percentage
 * Formula: Selling price = Total cost ÷ (1 - margin percentage)
 */
export function calculateSellingPrice(totalCost: number, marginPercentage: number): number {
  if (marginPercentage >= 100) return totalCost * 2 // Fallback for invalid margins
  return totalCost / (1 - marginPercentage / 100)
}

/**
 * Calculate profit margin as a percentage
 * Formula: Profit margin = (Selling price - Total cost) ÷ Selling price × 100
 */
export function calculateProfitMargin(sellingPrice: number, totalCost: number): number {
  if (sellingPrice === 0) return 0
  return ((sellingPrice - totalCost) / sellingPrice) * 100
}

/**
 * Calculate all product metrics at once
 */
export function calculateProduct(
  ingredients: Ingredient[],
  laborMinutes: number,
  hourlyRate: number,
  targetMargin: number
): ProductCalculation {
  const totalCost = calculateTotalCost(ingredients, laborMinutes, hourlyRate)
  const sellingPrice = calculateSellingPrice(totalCost, targetMargin)
  const profitMargin = calculateProfitMargin(sellingPrice, totalCost)

  return {
    totalCost,
    sellingPrice,
    profitMargin
  }
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format percentage values
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`
}