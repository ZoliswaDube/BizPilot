import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/auth'
import { supabase } from '../../lib/supabase'
import { ProfitMarginChart } from '../charts/ProfitMarginChart'
import { CostBreakdownChart } from '../charts/CostBreakdownChart'
import { ProfitTrendChart } from '../charts/ProfitTrendChart'
import { InventoryStatusChart } from '../charts/InventoryStatusChart'
import { Loader2, TrendingUp, PieChart, BarChart3, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  total_cost: number
  labor_minutes: number
  selling_price: number
  profit_margin: number
  created_at: string
}

interface InventoryItem {
  id: string
  name: string
  current_quantity: number
  low_stock_alert: number
  cost_per_unit: number
}

interface Ingredient {
  cost: number
  quantity: number
}

export function DashboardCharts() {
  const { user } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchChartData()
    }
  }, [user])

  const fetchChartData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (productsError) throw productsError

      // Fetch inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)

      if (inventoryError) throw inventoryError

      // Fetch all ingredients for cost breakdown
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('cost, quantity, product_id')
        .in('product_id', productsData?.map(p => p.id) || [])

      if (ingredientsError) throw ingredientsError

      setProducts(productsData || [])
      setInventory(inventoryData || [])
      setIngredients(ingredientsData || [])
    } catch (err) {
      console.error('Error fetching chart data:', err)
      setError('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card">
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
                <p className="mt-2 text-gray-400">Loading chart...</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-900/20 border-red-500/30">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">No Data for Charts</h3>
          <p className="text-gray-400 mb-6">
            Add some products to see analytics and charts
          </p>
        </div>
      </div>
    )
  }

  // Calculate cost breakdown data
  const totalMaterialCost = ingredients.reduce((sum, ing) => 
    sum + (ing.cost * ing.quantity), 0
  )
  const totalLaborCost = products.reduce((sum, product) => 
    sum + ((product.labor_minutes / 60) * 18.50), 0 // Using default hourly rate
  )
  const costBreakdownData = {
    materialCost: totalMaterialCost,
    laborCost: totalLaborCost,
    totalCost: totalMaterialCost + totalLaborCost
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-100">Business Analytics</h2>
        <div className="flex items-center text-sm text-gray-400">
          <TrendingUp className="h-4 w-4 mr-1" />
          Based on {products.length} products
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Margin Chart */}
        <div className="card">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-primary-400 mr-2" />
            <h3 className="font-semibold text-gray-100">Product Performance</h3>
          </div>
          <ProfitMarginChart products={products} />
        </div>

        {/* Cost Breakdown Chart */}
        <div className="card">
          <div className="flex items-center mb-4">
            <PieChart className="h-5 w-5 text-primary-400 mr-2" />
            <h3 className="font-semibold text-gray-100">Cost Structure</h3>
          </div>
          <CostBreakdownChart data={costBreakdownData} />
        </div>

        {/* Profit Trend Chart */}
        <div className="card">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-primary-400 mr-2" />
            <h3 className="font-semibold text-gray-100">Growth Potential</h3>
          </div>
          <ProfitTrendChart products={products} />
        </div>

        {/* Inventory Status Chart */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Package className="h-5 w-5 text-primary-400 mr-2" />
            <h3 className="font-semibold text-gray-100">Inventory Health</h3>
          </div>
          {inventory.length > 0 ? (
            <InventoryStatusChart inventory={inventory} />
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">No inventory data</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insights Summary */}
      <div className="card bg-gradient-to-br from-primary-900/20 to-accent-900/20 border-primary-700/30">
        <h3 className="font-semibold text-primary-300 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-400">
              {products.length > 0 ? Math.max(...products.map(p => p.profit_margin)).toFixed(1) + '%' : '0%'}
            </p>
            <p className="text-sm text-gray-300">Highest Margin</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-400">
              ${costBreakdownData.totalCost.toFixed(0)}
            </p>
            <p className="text-sm text-gray-300">Total Cost Base</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-400">
              ${products.reduce((sum, p) => sum + (p.selling_price - p.total_cost), 0).toFixed(0)}
            </p>
            <p className="text-sm text-gray-300">Profit Potential</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-400">
              {inventory.filter(i => i.current_quantity <= (i.low_stock_alert || 0)).length}
            </p>
            <p className="text-sm text-gray-300">Items Need Restock</p>
          </div>
        </div>
      </div>
    </div>
  )
}