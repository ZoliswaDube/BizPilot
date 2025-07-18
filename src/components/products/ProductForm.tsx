import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Calculator, Save, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useCategories } from '../../hooks/useCategories'
import { useSuppliers } from '../../hooks/useSuppliers'
import { supabase } from '../../lib/supabase'
import { 
  calculateProduct, 
  formatCurrency, 
  formatPercentage,
  type Ingredient 
} from '../../utils/calculations'
import { Database } from '../../lib/supabase'

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

interface ProductFormData {
  id?: string
  name: string
  laborMinutes: number
  targetMargin: number
  ingredients: Ingredient[]
  sku: string
  minStockLevel: number
  reorderPoint: number
  location: string
  supplierId: string | null
  imageUrl: string
  barcode: string
  categoryId: string | null
}

export function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { settings, loading: settingsLoading } = useUserSettings()
  const { categories, loading: categoriesLoading } = useCategories()
  const { suppliers, loading: suppliersLoading } = useSuppliers()

  const isEditMode = !!id

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    laborMinutes: 0,
    targetMargin: 40,
    ingredients: [{ name: '', cost: 0, quantity: 0, unit: 'unit' }],
    sku: '',
    minStockLevel: 0,
    reorderPoint: 0,
    location: '',
    supplierId: null,
    imageUrl: '',
    barcode: '',
    categoryId: null,
  })

  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(isEditMode)
  const [error, setError] = useState('')

  // Load existing product data if editing
  useEffect(() => {
    if (isEditMode && id && user) {
      loadProduct(id)
    }
  }, [isEditMode, id, user])

  // Update target margin when settings load
  useEffect(() => {
    if (settings && !isEditMode && formData.targetMargin === 40) {
      setFormData(prev => ({
        ...prev,
        targetMargin: settings.default_margin
      }))
    }
  }, [settings, isEditMode, formData.targetMargin])

  const loadProduct = async (productId: string) => {
    if (!user) return

    try {
      setLoadingProduct(true)
      setError('')

      // Fetch product data
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', user.id)
        .single()

      if (productError) throw productError
      if (!product) throw new Error('Product not found')

      // Fetch ingredients
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*')
        .eq('product_id', productId)
        .order('name')

      if (ingredientsError) throw ingredientsError

      // Update form data
      setFormData({
        id: product.id,
        name: product.name,
        laborMinutes: product.labor_minutes || 0,
        targetMargin: product.profit_margin || 0,
        ingredients: ingredients.length > 0 ? ingredients.map(ing => ({
          id: ing.id,
          name: ing.name,
          cost: ing.cost,
          quantity: ing.quantity,
          unit: ing.unit
        })) : [{ name: '', cost: 0, quantity: 0, unit: 'unit' }],
        sku: product.sku || '',
        minStockLevel: product.min_stock_level || 0,
        reorderPoint: product.reorder_point || 0,
        location: product.location || '',
        supplierId: product.supplier_id || null,
        imageUrl: product.image_url || '',
        barcode: product.barcode || '',
        categoryId: product.category_id || null,
      })
    } catch (err) {
      console.error('Error loading product:', err)
      setError(err instanceof Error ? err.message : 'Failed to load product')
    } finally {
      setLoadingProduct(false)
    }
  }

  const hourlyRate = settings?.hourly_rate || 15
  const calculations = calculateProduct(formData.ingredients, formData.laborMinutes, hourlyRate, formData.targetMargin)

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', cost: 0, quantity: 0, unit: 'unit' }]
    }))
  }

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index)
      }))
    }
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) => 
        i === index ? { ...ingredient, [field]: value } : ingredient
      )
    }))
  }

  const handleProductFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required')
      return
    }
    if (formData.sku.trim() && !/^[a-zA-Z0-9-]+$/.test(formData.sku.trim())) {
      setError('SKU can only contain letters, numbers, and hyphens.')
      return
    }
    if (formData.barcode.trim() && !/^[0-9]+$/.test(formData.barcode.trim())) {
      setError('Barcode can only contain numbers.')
      return
    }

    const validIngredients = formData.ingredients.filter(ing => 
      ing.name.trim() && ing.cost > 0 && ing.quantity > 0
    )

    if (validIngredients.length === 0) {
      setError('At least one valid ingredient is required')
      return
    }

    setLoading(true)
    setError('')

    const productDataToSave: ProductInsert | ProductUpdate = {
      name: formData.name.trim(),
      total_cost: calculations.totalCost,
      labor_minutes: formData.laborMinutes,
      selling_price: calculations.sellingPrice,
      profit_margin: calculations.profitMargin,
      sku: formData.sku.trim() || null,
      min_stock_level: formData.minStockLevel,
      reorder_point: formData.reorderPoint,
      location: formData.location.trim() || null,
      supplier_id: formData.supplierId,
      image_url: formData.imageUrl.trim() || null,
      barcode: formData.barcode.trim() || null,
      category_id: formData.categoryId,
    }

    try {
      if (isEditMode && formData.id) {
        // Update existing product
        const { error: productError } = await supabase
          .from('products')
          .update(productDataToSave)
          .eq('id', formData.id)
          .eq('user_id', user.id)

        if (productError) throw productError

        // Delete existing ingredients
        const { error: deleteError } = await supabase
          .from('ingredients')
          .delete()
          .eq('product_id', formData.id)

        if (deleteError) throw deleteError

        // Insert new ingredients
        const ingredientInserts = validIngredients.map(ingredient => ({
          product_id: formData.id,
          name: ingredient.name.trim(),
          cost: ingredient.cost,
          quantity: ingredient.quantity,
          unit: ingredient.unit
        }))

        const { error: ingredientsError } = await supabase
          .from('ingredients')
          .insert(ingredientInserts)

        if (ingredientsError) throw ingredientsError
      } else {
        // Create new product
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            ...productDataToSave,
            user_id: user.id,
          })
          .select()
          .single()

        if (productError) throw productError

        // Insert ingredients
        const ingredientInserts = validIngredients.map(ingredient => ({
          product_id: product.id,
          name: ingredient.name.trim(),
          cost: ingredient.cost,
          quantity: ingredient.quantity,
          unit: ingredient.unit
        }))

        const { error: ingredientsError } = await supabase
          .from('ingredients')
          .insert(ingredientInserts)

        if (ingredientsError) throw ingredientsError
      }

      navigate('/products')
    } catch (err) {
      console.error('Error saving product:', err)
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  if (settingsLoading || loadingProduct || categoriesLoading || suppliersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-400">
            {loadingProduct ? 'Loading product...' : categoriesLoading ? 'Loading categories...' : suppliersLoading ? 'Loading suppliers...' : 'Loading settings...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={() => navigate('/products')}
            className="p-2 text-gray-400 hover:text-gray-300 rounded-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {isEditMode ? 'Edit Product' : 'Add Product'}
            </h1>
            <p className="text-gray-400">
              {isEditMode 
                ? 'Update product details and pricing' 
                : 'Create a new product with ingredients and pricing'
              }
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Basic Info */}
            <motion.div 
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Product Information</h2>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Product Name *
                  </label>
                  <motion.input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleProductFieldChange}
                    className="input-field"
                    placeholder="Enter product name"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleProductFieldChange}
                    className="input-field"
                    placeholder="e.g., PROD-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Labor Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="laborMinutes"
                    value={formData.laborMinutes}
                    onChange={handleProductFieldChange}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId || ''}
                    onChange={handleProductFieldChange}
                    className="input-field"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Supplier
                  </label>
                  <select
                    name="supplierId"
                    value={formData.supplierId || ''}
                    onChange={handleProductFieldChange}
                    className="input-field"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Location/Bin
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleProductFieldChange}
                    className="input-field"
                    placeholder="e.g., Warehouse A, Shelf 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Minimum Stock Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="minStockLevel"
                    value={formData.minStockLevel}
                    onChange={handleProductFieldChange}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="reorderPoint"
                    value={formData.reorderPoint}
                    onChange={handleProductFieldChange}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleProductFieldChange}
                    className="input-field"
                    placeholder="https://example.com/product-image.jpg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleProductFieldChange}
                    className="input-field"
                    placeholder="e.g., 123456789012"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Ingredients */}
            <motion.div 
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100">Ingredients</h2>
                <motion.button
                  type="button"
                  onClick={addIngredient}
                  className="flex items-center text-sm text-primary-400 hover:text-primary-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Ingredient
                </motion.button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {formData.ingredients.map((ingredient, index) => (
                    <motion.div 
                      key={index} 
                      className="grid grid-cols-12 gap-3 items-end"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Name
                        </label>
                        <motion.input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                          className="input-field text-sm"
                          placeholder="Ingredient name"
                          whileFocus={{ scale: 1.02 }}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Cost
                        </label>
                        <motion.input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ingredient.cost}
                          onChange={(e) => updateIngredient(index, 'cost', parseFloat(e.target.value) || 0)}
                          className="input-field text-sm number-input"
                          placeholder="0.00"
                          whileFocus={{ scale: 1.02 }}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Quantity
                        </label>
                        <motion.input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="input-field text-sm number-input"
                          placeholder="0"
                          whileFocus={{ scale: 1.02 }}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Unit
                        </label>
                        <motion.select
                          value={ingredient.unit}
                          onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                          className="input-field text-sm"
                          whileFocus={{ scale: 1.02 }}
                        >
                          <option value="unit">unit</option>
                          <option value="lb">lb</option>
                          <option value="oz">oz</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="cup">cup</option>
                          <option value="tsp">tsp</option>
                          <option value="tbsp">tbsp</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                        </motion.select>
                      </div>
                      <div className="col-span-1">
                        {formData.ingredients.length > 1 && (
                          <motion.button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="p-2 text-red-400 hover:text-red-300"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Minus className="h-4 w-4" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Pricing */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Pricing</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Target Profit Margin (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="0.1"
                  name="targetMargin"
                  value={formData.targetMargin}
                  onChange={handleProductFieldChange}
                  className="input-field max-w-xs"
                  placeholder="40"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Default margin from your settings: {settings?.default_margin || 40}%
                </p>
              </div>
            </div>

            {/* Submit */}
            <motion.div 
              className="flex justify-end space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.button
                type="button"
                onClick={() => navigate('/products')}
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                className="btn-primary group flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                  </motion.div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isEditMode ? 'Update Product' : 'Save Product'}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        {/* Live Calculations */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="card bg-gradient-to-br from-primary-900/20 to-accent-900/20 border-primary-700/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center mb-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Calculator className="h-5 w-5 text-primary-400 mr-2" />
              </motion.div>
              <h3 className="font-semibold text-primary-300">Live Calculations</h3>
            </div>
            
            <div className="space-y-3">
              {[
                { label: 'Material Cost', value: formatCurrency(calculations.totalCost - (formData.laborMinutes / 60) * hourlyRate) },
                { label: 'Labor Cost', value: formatCurrency((formData.laborMinutes / 60) * hourlyRate) },
                { label: 'Total Cost', value: formatCurrency(calculations.totalCost), highlight: true },
                { label: 'Selling Price', value: formatCurrency(calculations.sellingPrice), highlight: true },
                { label: 'Profit Margin', value: formatPercentage(calculations.profitMargin), highlight: true },
                { label: 'Profit Amount', value: formatCurrency(calculations.sellingPrice - calculations.totalCost), profit: true }
              ].map((item, index) => (
                <motion.div 
                  key={item.label}
                  className={`flex justify-between ${item.highlight ? 'border-t border-dark-600 pt-2' : ''}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <span className={`text-sm text-gray-300`}>{item.label}:</span>
                  <motion.span 
                    className={`font-medium ${
                      item.profit ? 'text-green-400' : 
                      item.highlight ? 'font-bold text-gray-100' : 'text-gray-100'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1, type: "spring", stiffness: 300 }}
                  >
                    {item.value}
                  </motion.span>
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="mt-4 p-3 bg-dark-800 rounded border border-primary-700/30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <p className="text-xs text-gray-300">
                <strong>Note:</strong> Using hourly rate of {formatCurrency(hourlyRate)} from your settings.
                You can adjust this in Settings.
              </p>
            </motion.div>
          </motion.div>

          {isEditMode && (
            <motion.div 
              className="card bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4 }}
            >
              <h3 className="font-semibold text-blue-300 mb-2">Edit Mode</h3>
              <p className="text-sm text-gray-300">
                You're editing an existing product. Changes will be saved when you click "Update Product".
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}