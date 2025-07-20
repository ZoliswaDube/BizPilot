import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Package, Edit, Trash2, Calculator, Tag, Truck } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatPercentage } from '../../utils/calculations'
import { ImageDisplay } from '../ui/image-display'

interface Product {
  id: string
  name: string
  total_cost: number | null
  labor_minutes: number
  selling_price: number | null
  profit_margin: number | null
  created_at: string
  sku: string | null
  min_stock_level: number | null
  reorder_point: number | null
  location: string | null
  image_url: string | null
  barcode: string | null
  ingredient_count: number
  categories?: { name: string } | null
  suppliers?: { name: string } | null
}

export function ProductList() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      // Fetch products with ingredient count, category name, and supplier name
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          total_cost,
          labor_minutes,
          selling_price,
          profit_margin,
          created_at,
          sku,
          min_stock_level,
          reorder_point,
          location,
          image_url,
          barcode,
          ingredients (count),
          categories (name),
          suppliers (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to include ingredient count, category name, and supplier name
      const productsWithDetails = data.map(product => ({
        ...product,
        ingredient_count: Array.isArray(product.ingredients) ? product.ingredients.length : 0,
        categories: Array.isArray(product.categories) && product.categories.length > 0 ? product.categories[0] : null,
        suppliers: Array.isArray(product.suppliers) && product.suppliers.length > 0 ? product.suppliers[0] : null,
      }))

      setProducts(productsWithDetails as Product[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      setProducts(products.filter(p => p.id !== productId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Products</h1>
          <p className="text-gray-400">Manage your products and pricing</p>
        </div>
        <Link to="/products/new" className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </motion.div>

      {/* Search */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
          <motion.input
            type="text"
            placeholder="Search products by name, SKU, barcode, location, category, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
            whileFocus={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
        </div>
      </motion.div>

      {error && (
        <motion.div 
          className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {error}
        </motion.div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            {searchTerm ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first product to get started with cost calculations and pricing insights'
            }
          </p>
          {!searchTerm && (
            <Link to="/products/new" className="btn-primary group inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div 
              key={product.id} 
              className="card hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 border-dark-600 hover:border-primary-600/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-400">
                    {product.sku && <span className="mr-2">SKU: {product.sku}</span>}
                    {product.ingredient_count} ingredient{product.ingredient_count !== 1 ? 's' : ''}
                    {product.labor_minutes > 0 && ` • ${product.labor_minutes} min labor`}
                  </p>
                  {product.categories?.name && (
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Tag className="h-3 w-3 mr-1" /> {product.categories.name}
                    </p>
                  )}
                  {product.suppliers?.name && (
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Truck className="h-3 w-3 mr-1" /> {product.suppliers.name}
                    </p>
                  )}
                  {product.location && (
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      Location: {product.location}
                    </p>
                  )}
                  {product.barcode && (
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      Barcode: {product.barcode}
                    </p>
                  )}
                  {product.min_stock_level !== null && product.min_stock_level > 0 && (
                    <p className="text-xs text-yellow-400 flex items-center mt-1">
                      Min Stock: {product.min_stock_level}
                    </p>
                  )}
                  {product.reorder_point !== null && product.reorder_point > 0 && (
                    <p className="text-xs text-orange-400 flex items-center mt-1">
                      Reorder Point: {product.reorder_point}
                    </p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <motion.button
                    onClick={() => navigate(`/products/edit/${product.id}`)}
                    className="p-1 text-gray-500 hover:text-gray-300"
                    title="Edit product"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Edit className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    onClick={() => deleteProduct(product.id, product.name)}
                    className="p-1 text-gray-500 hover:text-red-400"
                    title="Delete product"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              <div className="mb-3">
                <ImageDisplay
                  src={product.image_url}
                  alt={product.name}
                  size="lg"
                  showZoom={true}
                  className="w-full h-32"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Cost:</span>
                  <span className="font-medium text-gray-100">
                    {formatCurrency(product.total_cost || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Selling Price:</span>
                  <span className="font-medium text-gray-100">
                    {formatCurrency(product.selling_price || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Profit Margin:</span>
                  <span className={`font-medium ${
                    (product.profit_margin || 0) >= 30 ? 'text-green-400' : 
                    (product.profit_margin || 0) >= 15 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(product.profit_margin || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-dark-700">
                  <span className="text-sm text-gray-400">Profit:</span>
                  <span className="font-bold text-green-400">
                    {formatCurrency((product.selling_price || 0) - (product.total_cost || 0))}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dark-700">
                <motion.button 
                  className="w-full flex items-center justify-center text-sm text-primary-400 hover:text-primary-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Calculator className="h-4 w-4 mr-1" />
                  View Details
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredProducts.length > 0 && (
        <motion.div 
          className="card bg-gradient-to-br from-dark-800 to-dark-900 border-dark-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + filteredProducts.length * 0.1 }}
        >
          <h3 className="font-semibold text-gray-100 mb-4">Portfolio Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Products', value: filteredProducts.length },
              { 
                label: 'Avg. Cost', 
                value: formatCurrency(
                  filteredProducts.reduce((sum, p) => sum + (p.total_cost || 0), 0) / filteredProducts.length
                )
              },
              { 
                label: 'Avg. Price', 
                value: formatCurrency(
                  filteredProducts.reduce((sum, p) => sum + (p.selling_price || 0), 0) / filteredProducts.length
                )
              },
              { 
                label: 'Avg. Margin', 
                value: formatPercentage(
                  filteredProducts.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / filteredProducts.length
                )
              }
            ].map((stat, index) => (
              <motion.div 
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <motion.p 
                  className="text-2xl font-bold text-gray-100"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, type: "spring", stiffness: 300 }}
                >
                  {stat.value}
                </motion.p>
              <p className="text-sm text-gray-400">Total Products</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}