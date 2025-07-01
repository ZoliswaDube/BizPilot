import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, Loader2 } from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/supabase'

type InventoryItemInsert = Database['public']['Tables']['inventory']['Insert']
type InventoryItemUpdate = Database['public']['Tables']['inventory']['Update']
type Product = Database['public']['Tables']['products']['Row']

export function InventoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { addInventoryItem, updateInventoryItem } = useInventory()

  const isEditMode = !!id

  const [formData, setFormData] = useState<Partial<InventoryItemInsert>>({
    name: '',
    product_id: null,
    current_quantity: 0,
    unit: 'unit',
    low_stock_alert: 5,
    cost_per_unit: 0,
    batch_lot_number: '',
    expiration_date: ''
  })
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingItem, setLoadingItem] = useState(isEditMode)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchProducts()
      if (isEditMode && id) {
        loadInventoryItem(id)
      }
    }
  }, [user, isEditMode, id])

  const fetchProducts = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to load products for selection.')
    }
  }

  const loadInventoryItem = async (itemId: string) => {
    if (!user) return

    try {
      setLoadingItem(true)
      setError('')
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Inventory item not found')

      setFormData({
        name: data.name,
        product_id: data.product_id,
        current_quantity: data.current_quantity,
        unit: data.unit,
        low_stock_alert: data.low_stock_alert,
        cost_per_unit: data.cost_per_unit,
        batch_lot_number: data.batch_lot_number || '',
        expiration_date: data.expiration_date || ''
      })
    } catch (err) {
      console.error('Error loading inventory item:', err)
      setError(err instanceof Error ? err.message : 'Failed to load inventory item')
    } finally {
      setLoadingItem(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name?.trim() && !formData.product_id) {
      setError('Either a name or a linked product is required.')
      setLoading(false)
      return
    }
    if (formData.current_quantity === undefined || formData.current_quantity < 0) {
      setError('Current quantity must be a non-negative number.')
      setLoading(false)
      return
    }
    if (formData.cost_per_unit === undefined || formData.cost_per_unit < 0) {
      setError('Cost per unit must be a non-negative number.')
      setLoading(false)
      return
    }

    try {
      let resultError: string | null = null
      if (isEditMode && id) {
        const { error } = await updateInventoryItem(id, formData as InventoryItemUpdate)
        resultError = error
      } else {
        const { error } = await addInventoryItem(formData as Omit<InventoryItemInsert, 'user_id'>)
        resultError = error
      }

      if (resultError) {
        setError(resultError)
      } else {
        navigate('/inventory')
      }
    } catch (err) {
      console.error('Error saving inventory item:', err)
      setError(err instanceof Error ? err.message : 'Failed to save inventory item')
    } finally {
      setLoading(false)
    }
  }

  if (loadingItem) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-400">Loading inventory item...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 text-gray-400 hover:text-gray-300 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {isEditMode ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h1>
            <p className="text-gray-400">
              {isEditMode
                ? 'Update details for this inventory item'
                : 'Add a new item to your inventory stock'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Item Name (e.g., "Flour", "Sugar")
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="input-field"
              value={formData.name || ''}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="e.g., Raw Material A"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use this for raw materials or generic items not linked to a specific product.
            </p>
          </div>

          <div>
            <label htmlFor="product_id" className="block text-sm font-medium text-gray-300 mb-1">
              Link to Product (Optional)
            </label>
            <select
              id="product_id"
              name="product_id"
              className="input-field"
              value={formData.product_id || ''}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="">-- Select a Product --</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Link this inventory item to a finished product if it represents stock of that product.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="current_quantity" className="block text-sm font-medium text-gray-300 mb-1">
                Current Quantity *
              </label>
              <input
                type="number"
                id="current_quantity"
                name="current_quantity"
                step="0.01"
                min="0"
                className="input-field"
                value={formData.current_quantity || 0}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-300 mb-1">
                Unit *
              </label>
              <select
                id="unit"
                name="unit"
                className="input-field"
                value={formData.unit || 'unit'}
                onChange={handleInputChange}
                disabled={loading}
                required
              >
                <option value="unit">unit</option>
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lb">lb</option>
                <option value="oz">oz</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="gal">gal</option>
                <option value="cup">cup</option>
                <option value="tsp">tsp</option>
                <option value="tbsp">tbsp</option>
                <option value="box">box</option>
                <option value="pack">pack</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cost_per_unit" className="block text-sm font-medium text-gray-300 mb-1">
                Cost Per Unit *
              </label>
              <input
                type="number"
                id="cost_per_unit"
                name="cost_per_unit"
                step="0.01"
                min="0"
                className="input-field"
                value={formData.cost_per_unit || 0}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label htmlFor="low_stock_alert" className="block text-sm font-medium text-gray-300 mb-1">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                id="low_stock_alert"
                name="low_stock_alert"
                step="0.01"
                min="0"
                className="input-field"
                value={formData.low_stock_alert || 0}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="batch_lot_number" className="block text-sm font-medium text-gray-300 mb-1">
              Batch/Lot Number (Optional)
            </label>
            <input
              type="text"
              id="batch_lot_number"
              name="batch_lot_number"
              className="input-field"
              value={formData.batch_lot_number || ''}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="e.g., BATCH-20231026-001"
            />
          </div>

          <div>
            <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-300 mb-1">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              id="expiration_date"
              name="expiration_date"
              className="input-field"
              value={formData.expiration_date || ''}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary group flex items-center"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}