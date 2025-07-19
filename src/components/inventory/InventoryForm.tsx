import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Package, Hash, AlertTriangle, Calendar, Save, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useBusiness } from '../../hooks/useBusiness'
import { ManualNumberInput } from '../ui/manual-number-input'
import { ImageInput } from '../ui/image-input'
import { formatCurrency } from '../../utils/calculations'
import { Database } from '../../lib/supabase'
import { useInventory } from '../../hooks/useInventory'

type InventoryItem = Database['public']['Tables']['inventory']['Row']
type InsertInventoryItem = Database['public']['Tables']['inventory']['Insert']
type UpdateInventoryItem = Database['public']['Tables']['inventory']['Update']

export function InventoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { business } = useBusiness()
  const { addInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventory()

  const isEditing = !!id
  const [loading, setLoading] = useState(isEditing)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    current_quantity: 0,
    cost_per_unit: 0,
    low_stock_alert: 0,
    unit: '',
    batch_lot_number: '',
    expiration_date: '',
    description: '',
    supplier: '',
    location: '',
    min_order_quantity: 0,
    reorder_point: 0,
    image_url: ''
  })

  // Load existing item data if editing
  useEffect(() => {
    if (isEditing && id && user) {
      loadInventoryItem(id)
    }
  }, [isEditing, id, user])

  const loadInventoryItem = async (itemId: string) => {
    if (!user) return

    try {
      setLoading(true)
      setFormError('')

      const { data: item, error } = await fetch(`/api/inventory/${itemId}`).then(res => res.json())

      if (error) throw new Error(error)
      if (item) {
        setFormData({
          name: item.name || '',
          current_quantity: item.current_quantity || 0,
          cost_per_unit: item.cost_per_unit || 0,
          low_stock_alert: item.low_stock_alert || 0,
          unit: item.unit || '',
          batch_lot_number: item.batch_lot_number || '',
          expiration_date: item.expiration_date ? item.expiration_date.split('T')[0] : '',
          description: '',
          supplier: '',
          location: '',
          min_order_quantity: 0,
          reorder_point: 0,
          image_url: ''
        })
      }
    } catch (err) {
      console.error('Error loading inventory item:', err)
      setFormError('Failed to load inventory item')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !business) return
    
    setSubmitLoading(true)
    setFormError('')

    try {
      const itemData = {
        name: formData.name.trim(),
        current_quantity: formData.current_quantity,
        cost_per_unit: formData.cost_per_unit,
        low_stock_alert: formData.low_stock_alert,
        unit: formData.unit.trim(),
        batch_lot_number: formData.batch_lot_number.trim() || null,
        expiration_date: formData.expiration_date || null,
        description: formData.description.trim() || null,
        supplier: formData.supplier.trim() || null,
        location: formData.location.trim() || null,
        min_order_quantity: formData.min_order_quantity,
        reorder_point: formData.reorder_point,
        image_url: formData.image_url.trim() || null
      }

      if (isEditing) {
        const { error } = await updateInventoryItem(id, itemData)
        if (error) {
          setFormError(error)
        } else {
          navigate('/inventory')
        }
      } else {
        const { error } = await addInventoryItem(itemData)
        if (error) {
          setFormError(error)
        } else {
          navigate('/inventory')
        }
      }
    } catch (err) {
      setFormError('Failed to save inventory item')
    }

    setSubmitLoading(false)
  }

  const handleDelete = async () => {
    if (!isEditing) return

    if (!window.confirm('Are you sure you want to delete this inventory item? This action cannot be undone.')) {
      return
    }

    setDeleteLoading(true)
    setFormError('')

    try {
      const { error } = await deleteInventoryItem(id)
      if (error) {
        setFormError(error)
      } else {
        navigate('/inventory')
      }
    } catch (err) {
      setFormError('Failed to delete inventory item')
    }

    setDeleteLoading(false)
  }

  // Check permissions
  const canEdit = user && (business?.userRole === 'admin' || business?.userRole === 'manager')
  const canDelete = user && business?.userRole === 'admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 mx-auto text-primary-600" />
          </motion.div>
          <p className="mt-2 text-gray-400">Loading...</p>
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
            onClick={() => navigate('/inventory')}
            className="p-2 text-gray-400 hover:text-gray-300 rounded-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h1>
            <p className="text-gray-400">
              {isEditing ? 'Update inventory item details' : 'Add a new item to your inventory'}
            </p>
          </div>
        </div>
        
        {isEditing && canDelete && (
          <motion.button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="btn-danger flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {deleteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete Item
          </motion.button>
        )}
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
              {formError && (
                <motion.div 
                  className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {formError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Basic Information */}
            <motion.div 
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-400" />
                Basic Information
              </h2>
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Item Name *
                  </label>
                  <motion.input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Enter item name"
                    required
                    disabled={!canEdit}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Quantity *
                    </label>
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <ManualNumberInput
                        step={0.01}
                        value={formData.current_quantity.toString()}
                        onChange={(value) => setFormData({ ...formData, current_quantity: parseFloat(value) || 0 })}
                        className="input-field"
                        placeholder="0"
                        required
                        disabled={!canEdit}
                      />
                    </motion.div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Unit *
                    </label>
                    <motion.input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="input-field"
                      placeholder="e.g., pieces, kg, liters"
                      required
                      disabled={!canEdit}
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <motion.textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Optional description"
                    disabled={!canEdit}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Pricing Information */}
            <motion.div 
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary-400" />
                Pricing Information
              </h2>
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cost per Unit
                  </label>
                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <ManualNumberInput
                      step={0.01}
                      value={formData.cost_per_unit.toString()}
                      onChange={(value) => setFormData({ ...formData, cost_per_unit: parseFloat(value) || 0 })}
                      className="input-field"
                      placeholder="0.00"
                      disabled={!canEdit}
                    />
                  </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Low Stock Alert
                    </label>
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <ManualNumberInput
                        step={0.01}
                        value={formData.low_stock_alert.toString()}
                        onChange={(value) => setFormData({ ...formData, low_stock_alert: parseFloat(value) || 0 })}
                        className="input-field"
                        placeholder="0"
                        disabled={!canEdit}
                      />
                    </motion.div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Reorder Point
                    </label>
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <ManualNumberInput
                        step={0.01}
                        value={formData.reorder_point.toString()}
                        onChange={(value) => setFormData({ ...formData, reorder_point: parseFloat(value) || 0 })}
                        className="input-field"
                        placeholder="0"
                        disabled={!canEdit}
                      />
                    </motion.div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum Order Quantity
                  </label>
                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <ManualNumberInput
                      step={0.01}
                      value={formData.min_order_quantity.toString()}
                      onChange={(value) => setFormData({ ...formData, min_order_quantity: parseFloat(value) || 0 })}
                      className="input-field"
                      placeholder="0"
                      disabled={!canEdit}
                    />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* Additional Information */}
            <motion.div 
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary-400" />
                Additional Information
              </h2>
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Batch/Lot Number
                  </label>
                  <motion.input
                    type="text"
                    value={formData.batch_lot_number}
                    onChange={(e) => setFormData({ ...formData, batch_lot_number: e.target.value })}
                    className="input-field"
                    placeholder="Optional batch number"
                    disabled={!canEdit}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expiration Date
                  </label>
                  <motion.input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    className="input-field"
                    disabled={!canEdit}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Supplier
                  </label>
                  <motion.input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="input-field"
                    placeholder="Supplier name"
                    disabled={!canEdit}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <motion.input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                    placeholder="Storage location"
                    disabled={!canEdit}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Item Image
                  </label>
                  <ImageInput
                    value={formData.image_url}
                    onChange={(value) => setFormData(prev => ({ ...prev, image_url: value }))}
                    onError={(error) => setFormError(error)}
                    placeholder="Add item image..."
                    maxSize={5}
                    accept="image/*"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Submit Button */}
            <motion.div 
              className="flex items-center justify-end gap-4 pt-6 border-t border-dark-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <motion.button
                type="button"
                onClick={() => navigate('/inventory')}
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={submitLoading || !canEdit}
                className="btn-primary flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {submitLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEditing ? 'Update Item' : 'Add Item'}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
}