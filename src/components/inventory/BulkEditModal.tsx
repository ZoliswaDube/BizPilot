import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, AlertTriangle, Package, DollarSign, Hash } from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { useBusiness } from '../../hooks/useBusiness'
import { ManualNumberInput } from '../ui/manual-number-input'
import { formatCurrency } from '../../utils/calculations'
import { Database } from '../../lib/supabase'

type InventoryItem = Database['public']['Tables']['inventory']['Row'] & {
  products?: { name: string } | null
}

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  items: InventoryItem[]
  onSuccess: () => void
}

export function BulkEditModal({ isOpen, onClose, items, onSuccess }: BulkEditModalProps) {
  const { updateInventoryItem, adjustStock } = useInventory()
  const { hasPermission } = useBusiness()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Bulk edit fields
  const [bulkFields, setBulkFields] = useState({
    cost_per_unit: '',
    low_stock_alert: '',
    unit: '',
    batch_lot_number: '',
    expiration_date: ''
  })
  
  // Bulk adjust fields
  const [bulkAdjust, setBulkAdjust] = useState({
    quantity_change: 0,
    notes: ''
  })

  const canEdit = hasPermission('inventory', 'update')

  const handleBulkUpdate = async () => {
    if (!canEdit) return
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      let successCount = 0
      let errorCount = 0
      
      for (const item of items) {
        const updates: any = {}
        
        // Only update fields that have values
        if (bulkFields.cost_per_unit !== '') {
          updates.cost_per_unit = parseFloat(bulkFields.cost_per_unit)
        }
        if (bulkFields.low_stock_alert !== '') {
          updates.low_stock_alert = parseFloat(bulkFields.low_stock_alert)
        }
        if (bulkFields.unit !== '') {
          updates.unit = bulkFields.unit
        }
        if (bulkFields.batch_lot_number !== '') {
          updates.batch_lot_number = bulkFields.batch_lot_number
        }
        if (bulkFields.expiration_date !== '') {
          updates.expiration_date = bulkFields.expiration_date
        }
        
        if (Object.keys(updates).length > 0) {
          const { error } = await updateInventoryItem(item.id, updates)
          if (error) {
            errorCount++
          } else {
            successCount++
          }
        }
      }
      
      if (errorCount > 0) {
        setError(`${successCount} items updated successfully, ${errorCount} failed`)
      } else {
        setSuccess(`Successfully updated ${successCount} items`)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      }
    } catch (err) {
      setError('Failed to update items')
    }
    
    setLoading(false)
  }

  const handleBulkAdjust = async () => {
    if (!canEdit || bulkAdjust.quantity_change === 0) return
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      let successCount = 0
      let errorCount = 0
      
      for (const item of items) {
        const { error } = await adjustStock(
          item.id, 
          bulkAdjust.quantity_change, 
          bulkAdjust.notes
        )
        if (error) {
          errorCount++
        } else {
          successCount++
        }
      }
      
      if (errorCount > 0) {
        setError(`${successCount} items adjusted successfully, ${errorCount} failed`)
      } else {
        setSuccess(`Successfully adjusted ${successCount} items`)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      }
    } catch (err) {
      setError('Failed to adjust items')
    }
    
    setLoading(false)
  }

  const resetForm = () => {
    setBulkFields({
      cost_per_unit: '',
      low_stock_alert: '',
      unit: '',
      batch_lot_number: '',
      expiration_date: ''
    })
    setBulkAdjust({
      quantity_change: 0,
      notes: ''
    })
    setError('')
    setSuccess('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-dark-900 rounded-xl shadow-2xl border border-dark-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-600/20 rounded-lg">
                  <Package className="h-5 w-5 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-100">
                    Bulk Edit Inventory
                  </h2>
                  <p className="text-sm text-gray-400">
                    Update {items.length} selected items
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error/Success Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    className="bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Save className="h-4 w-4" />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selected Items Summary */}
              <div className="bg-dark-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-200 mb-3">Selected Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {items.slice(0, 6).map((item) => (
                    <div key={item.id} className="text-sm text-gray-400">
                      • {item.name} ({item.current_quantity} {item.unit})
                    </div>
                  ))}
                  {items.length > 6 && (
                    <div className="text-sm text-gray-500">
                      ... and {items.length - 6} more items
                    </div>
                  )}
                </div>
              </div>

              {/* Bulk Update Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-100">Update Fields</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cost per Unit
                    </label>
                    <ManualNumberInput
                      step={0.01}
                      value={bulkFields.cost_per_unit}
                      onChange={(value) => setBulkFields({ ...bulkFields, cost_per_unit: value })}
                      placeholder="Leave empty to skip"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Low Stock Alert
                    </label>
                    <ManualNumberInput
                      step={0.01}
                      value={bulkFields.low_stock_alert}
                      onChange={(value) => setBulkFields({ ...bulkFields, low_stock_alert: value })}
                      placeholder="Leave empty to skip"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={bulkFields.unit}
                      onChange={(e) => setBulkFields({ ...bulkFields, unit: e.target.value })}
                      placeholder="Leave empty to skip"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Batch/Lot Number
                    </label>
                    <input
                      type="text"
                      value={bulkFields.batch_lot_number}
                      onChange={(e) => setBulkFields({ ...bulkFields, batch_lot_number: e.target.value })}
                      placeholder="Leave empty to skip"
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={bulkFields.expiration_date}
                      onChange={(e) => setBulkFields({ ...bulkFields, expiration_date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Bulk Adjust Stock */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-100">Adjust Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quantity Change (+/-)
                    </label>
                    <ManualNumberInput
                      step={0.01}
                      value={bulkAdjust.quantity_change === 0 ? '' : bulkAdjust.quantity_change.toString()}
                      onChange={(value) => setBulkAdjust({ ...bulkAdjust, quantity_change: parseFloat(value) || 0 })}
                      placeholder="0 to skip"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={bulkAdjust.notes}
                      onChange={(e) => setBulkAdjust({ ...bulkAdjust, notes: e.target.value })}
                      placeholder="Optional notes"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-dark-700">
              <button
                onClick={resetForm}
                className="btn-secondary"
                disabled={loading}
              >
                Reset
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpdate}
                  disabled={loading || !canEdit}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading && <Save className="h-4 w-4 animate-spin" />}
                  Update Items
                </button>
                {bulkAdjust.quantity_change !== 0 && (
                  <button
                    onClick={handleBulkAdjust}
                    disabled={loading || !canEdit}
                    className="btn-accent flex items-center gap-2"
                  >
                    {loading && <Hash className="h-4 w-4 animate-spin" />}
                    Adjust Stock
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 