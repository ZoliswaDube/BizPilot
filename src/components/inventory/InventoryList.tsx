import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { formatCurrency } from '../../utils/calculations'
import { Database } from '../../lib/supabase'

type InventoryItem = Database['public']['Tables']['inventory']['Row'] & {
  products?: { name: string } | null
}

export function InventoryList() {
  const { inventory, loading, error, deleteInventoryItem, adjustStock } = useInventory()
  const [searchTerm, setSearchTerm] = useState('')
  const [formError, setFormError] = useState('')
  const [adjustingItemId, setAdjustingItemId] = useState<string | null>(null)
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0)
  const [adjustNotes, setAdjustNotes] = useState<string>('')
  const [submitLoading, setSubmitLoading] = useState(false)

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batch_lot_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.unit.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdjustClick = (item: InventoryItem) => {
    setAdjustingItemId(item.id)
    setAdjustQuantity(0) // Reset quantity for new adjustment
    setAdjustNotes('')
    setFormError('')
  }

  const handleAdjustSubmit = async (e: React.FormEvent, itemId: string) => {
    e.preventDefault()
    setFormError('')
    if (adjustQuantity === 0) {
      setFormError('Quantity change cannot be zero.')
      return
    }
    setSubmitLoading(true)
    const { error } = await adjustStock(itemId, adjustQuantity, adjustNotes)
    if (error) {
      setFormError(error)
    } else {
      setAdjustingItemId(null)
    }
    setSubmitLoading(false)
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the inventory item "${name}"? This cannot be undone.`)) {
      setFormError('')
      setSubmitLoading(true)
      const { error } = await deleteInventoryItem(id)
      if (error) {
        setFormError(error)
      }
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <motion.div 
        className="flex items-center justify-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 mx-auto text-primary-600" />
          </motion.div>
          <p className="mt-2 text-gray-400">Loading inventory...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-bold text-gray-100">Inventory</h1>
          <p className="text-gray-400">Track and manage your stock levels.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/inventory/new" className="btn-primary group flex items-center">
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Plus className="h-4 w-4 mr-2" />
            </motion.div>
          Add Item
          </Link>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      >
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
          <motion.input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
            whileFocus={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {formError && (
          <motion.div 
            className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            {formError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory List */}
      {filteredInventory.length === 0 ? (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
        >
          <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            {searchTerm ? 'No inventory items found' : 'No inventory items yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Add your first inventory item to start tracking stock.'
            }
          </p>
          {!searchTerm && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link to="/inventory/new" className="btn-primary group inline-flex items-center">
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                </motion.div>
              Add Your First Item
              </Link>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item) => (
            <motion.div 
              key={item.id} 
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.5 + filteredInventory.indexOf(item) * 0.1, 
                ease: "easeOut" 
              }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100 mb-1">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Current Stock: {item.current_quantity} {item.unit}
                  </p>
                  {item.low_stock_alert !== null && item.current_quantity <= item.low_stock_alert && (
                    <p className="text-xs text-red-400 flex items-center mt-1">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Low Stock Alert! ({item.low_stock_alert} {item.unit})
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAdjustClick(item)}
                    className="text-primary-400 hover:text-primary-300"
                    title="Adjust stock"
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Plus className="h-4 w-4" />
                    </motion.div>
                  </button>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Link
                      to={`/inventory/edit/${item.id}`}
                      className="text-primary-400 hover:text-primary-300"
                      title="Edit item"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </motion.div>
                  <motion.button
                    onClick={() => handleDeleteItem(item.id, item.product_id ? item.products?.name || 'Product' : item.name)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete item"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                {item.cost_per_unit !== null && (
                  <p>Cost per unit: {formatCurrency(item.cost_per_unit)}</p>
                )}
                {item.batch_lot_number && <p>Batch/Lot: {item.batch_lot_number}</p>}
                {item.expiration_date && <p>Expires: {new Date(item.expiration_date).toLocaleDateString()}</p>}
              </div>

              {adjustingItemId === item.id && (
                <motion.form 
                  onSubmit={(e) => handleAdjustSubmit(e, item.id)} 
                  className="mt-4 space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="flex gap-2">
                    <motion.input
                      type="number"
                      step="0.01"
                      placeholder="Quantity Change (+/-)"
                      value={adjustQuantity === 0 ? '' : adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseFloat(e.target.value) || 0)}
                      className="input-field flex-grow text-sm"
                      disabled={submitLoading}
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    />
                    <motion.button
                      type="submit"
                      className="btn-primary group flex items-center text-sm px-3 py-1.5"
                      disabled={submitLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {submitLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                      Apply
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setAdjustingItemId(null)}
                      className="btn-secondary text-sm px-3 py-1.5"
                      disabled={submitLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                  <motion.input
                    type="text"
                    placeholder="Notes (optional)"
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    className="input-field text-sm"
                    disabled={submitLoading}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </motion.form>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}