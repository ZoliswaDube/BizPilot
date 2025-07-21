import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  CheckSquare,
  Square,
  AlertTriangle,
  Calendar,
  Package,
  DollarSign,
  Hash
} from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { useBusiness } from '../../hooks/useBusiness'
import { ManualNumberInput } from '../ui/manual-number-input'
import { ImageDisplay } from '../ui/image-display'
import { formatCurrency } from '../../utils/calculations'
import { Database } from '../../lib/supabase'
import { BulkEditModal } from './BulkEditModal'

type InventoryItem = Database['public']['Tables']['inventory']['Row'] & {
  products?: { name: string } | null
}

type SortField = 'name' | 'current_quantity' | 'cost_per_unit' | 'expiration_date' | 'updated_at'
type SortDirection = 'asc' | 'desc'

interface InventoryTableProps {
  onDelete: (id: string, name: string) => void
}

export function InventoryTable({ onDelete }: InventoryTableProps) {
  const { inventory, loading, adjustStock, updateInventoryItem } = useInventory()
  const { userRole, hasPermission } = useBusiness()
  
  // State for table functionality
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [editingItems, setEditingItems] = useState<Set<string>>(new Set())
  const [editingValues, setEditingValues] = useState<Record<string, Partial<InventoryItem & { current_quantity: string | number; cost_per_unit: string | number }>>>({})
  const [bulkAdjustQuantity, setBulkAdjustQuantity] = useState<number>(0)
  const [bulkAdjustNotes, setBulkAdjustNotes] = useState<string>('')
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Check if user can edit inventory
  const canEdit = hasPermission('inventory', 'update') || userRole === 'admin' || userRole === 'manager'

  // Filtered and sorted inventory
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = inventory.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch_lot_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort the filtered items
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Handle null values
      if (aValue === null) aValue = ''
      if (bValue === null) bValue = ''

      // Handle date sorting
      if (sortField === 'expiration_date' || sortField === 'updated_at') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [inventory, searchTerm, sortField, sortDirection])

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Handle selection
  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedInventory.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredAndSortedInventory.map(item => item.id)))
    }
  }

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  // Handle inline editing
  const handleCellEdit = (itemId: string, field: 'current_quantity' | 'cost_per_unit', value: string) => {
    const newEditingItems = new Set(editingItems)
    newEditingItems.add(itemId)
    setEditingItems(newEditingItems)
    
    const newEditingValues = { ...editingValues }
    if (!newEditingValues[itemId]) {
      newEditingValues[itemId] = {}
    }
    newEditingValues[itemId][field] = value as any
    setEditingValues(newEditingValues)
    setHasUnsavedChanges(true)
  }

  const handleSaveAll = async () => {
    if (!canEdit || editingItems.size === 0) return
    
    setSubmitLoading(true)
    setFormError('')
    
    try {
      let successCount = 0
      let errorCount = 0
      
      for (const itemId of editingItems) {
        const values = editingValues[itemId]
        if (!values) continue
        
        const parsedValues: Partial<InventoryItem> = {}
        if (values.current_quantity !== undefined) {
          parsedValues.current_quantity = parseFloat(String(values.current_quantity).replace(',', '.')) || 0
        }
        if (values.cost_per_unit !== undefined) {
          parsedValues.cost_per_unit = parseFloat(String(values.cost_per_unit).replace(',', '.')) || 0
        }
        
        const { error } = await updateInventoryItem(itemId, parsedValues)
        if (error) {
          errorCount++
        } else {
          successCount++
        }
      }
      
      if (errorCount > 0) {
        setFormError(`${successCount} items updated successfully, ${errorCount} failed`)
      } else {
        setEditingItems(new Set())
        setEditingValues({})
        setHasUnsavedChanges(false)
      }
    } catch (err) {
      setFormError('Failed to update items')
    }
    
    setSubmitLoading(false)
  }

  const handleCancelAll = () => {
    setEditingItems(new Set())
    setEditingValues({})
    setHasUnsavedChanges(false)
  }

  // Handle bulk operations
  const handleBulkAdjust = async () => {
    if (selectedItems.size === 0 || bulkAdjustQuantity === 0) return
    
    setSubmitLoading(true)
    setFormError('')
    
    try {
      const selectedItemsList = filteredAndSortedInventory.filter(item => selectedItems.has(item.id))
      let successCount = 0
      let errorCount = 0
      
      for (const item of selectedItemsList) {
        const { error } = await adjustStock(item.id, bulkAdjustQuantity, bulkAdjustNotes)
        if (error) {
          errorCount++
        } else {
          successCount++
        }
      }
      
      if (errorCount > 0) {
        setFormError(`${successCount} items updated successfully, ${errorCount} failed`)
      } else {
        setSelectedItems(new Set())
        setBulkAdjustQuantity(0)
        setBulkAdjustNotes('')
        setShowBulkActions(false)
      }
    } catch (err) {
      setFormError('Failed to update items')
    }
    
    setSubmitLoading(false)
  }

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Package className="h-8 w-8 mx-auto text-primary-600" />
          </motion.div>
          <p className="mt-2 text-gray-400">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        
        <div className="flex gap-2">
          {canEdit && hasUnsavedChanges && (
            <>
              <motion.button
                onClick={handleSaveAll}
                disabled={submitLoading}
                className="btn-primary flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {submitLoading ? (
                  <Package className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckSquare className="h-4 w-4" />
                )}
                Save All ({editingItems.size})
              </motion.button>
              <motion.button
                onClick={handleCancelAll}
                disabled={submitLoading}
                className="btn-secondary flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Trash2 className="h-4 w-4" />
                Cancel
              </motion.button>
            </>
          )}
          {canEdit && selectedItems.size > 0 && (
            <>
              <motion.button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="btn-secondary flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Filter className="h-4 w-4" />
                Bulk Actions ({selectedItems.size})
              </motion.button>
              <motion.button
                onClick={() => setShowBulkEditModal(true)}
                className="btn-primary flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Edit className="h-4 w-4" />
                Bulk Edit ({selectedItems.size})
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {showBulkActions && selectedItems.size > 0 && (
          <motion.div
            className="card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-200 mb-2">Bulk Adjust Stock</h3>
                <div className="flex gap-2">
                  <ManualNumberInput
                    step={0.01}
                    value={bulkAdjustQuantity === 0 ? '' : bulkAdjustQuantity.toString()}
                    onChange={(value) => setBulkAdjustQuantity(parseFloat(value) || 0)}
                    placeholder="Quantity Change (+/-)"
                    className="input-field flex-1"
                    disabled={submitLoading}
                  />
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={bulkAdjustNotes}
                    onChange={(e) => setBulkAdjustNotes(e.target.value)}
                    className="input-field flex-1"
                    disabled={submitLoading}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkAdjust}
                  disabled={submitLoading || bulkAdjustQuantity === 0}
                  className="btn-primary flex items-center gap-2"
                >
                  {submitLoading && <Package className="h-4 w-4 animate-spin" />}
                  Apply to {selectedItems.size} items
                </button>
                <button
                  onClick={() => {
                    setShowBulkActions(false)
                    setSelectedItems(new Set())
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {formError && (
          <motion.div
            className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {formError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-gray-300 hover:text-gray-100"
                  >
                    {selectedItems.size === filteredAndSortedInventory.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Image</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-gray-300 hover:text-gray-100"
                  >
                    <Package className="h-4 w-4" />
                    Name {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('current_quantity')}
                    className="flex items-center gap-2 text-gray-300 hover:text-gray-100"
                  >
                    <Hash className="h-4 w-4" />
                    Quantity {getSortIcon('current_quantity')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('cost_per_unit')}
                    className="flex items-center gap-2 text-gray-300 hover:text-gray-100"
                  >
                    <DollarSign className="h-4 w-4" />
                    Cost/Unit {getSortIcon('cost_per_unit')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('expiration_date')}
                    className="flex items-center gap-2 text-gray-300 hover:text-gray-100"
                  >
                    <Calendar className="h-4 w-4" />
                    Expires {getSortIcon('expiration_date')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Batch/Lot</th>
                <th className="px-4 py-3 text-left">Status</th>
                {canEdit && <th className="px-4 py-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredAndSortedInventory.map((item) => (
                <motion.tr
                  key={item.id}
                  className="hover:bg-dark-800/30 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSelectItem(item.id)}
                      className="text-gray-300 hover:text-gray-100"
                    >
                      {selectedItems.has(item.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <ImageDisplay
                      src={(item as any).image_url}
                      alt={item.name}
                      size="sm"
                      showZoom={true}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-100">{item.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <ManualNumberInput
                          step={0.01}
                          value={editingValues[item.id]?.current_quantity !== undefined 
                            ? String(editingValues[item.id].current_quantity) 
                            : String(item.current_quantity)
                          }
                          onChange={(value) => handleCellEdit(item.id, 'current_quantity', value)}
                          className="input-field text-sm w-20 bg-transparent border-transparent hover:border-primary-500 focus:border-primary-500"
                          disabled={submitLoading}
                        />
                        <span className="text-gray-400 text-sm">{item.unit}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-100">{item.current_quantity}</span>
                        <span className="text-gray-400 text-sm">{item.unit}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <ManualNumberInput
                        step={0.01}
                        value={editingValues[item.id]?.cost_per_unit !== undefined 
                          ? String(editingValues[item.id].cost_per_unit) 
                          : String(item.cost_per_unit || '')
                        }
                        onChange={(value) => handleCellEdit(item.id, 'cost_per_unit', value)}
                        className="input-field text-sm w-24 bg-transparent border-transparent hover:border-primary-500 focus:border-primary-500"
                        disabled={submitLoading}
                        placeholder="-"
                      />
                    ) : (
                      <div className="text-gray-100">
                        {item.cost_per_unit ? formatCurrency(item.cost_per_unit) : '-'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-100">
                      {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-400 text-sm">
                      {item.batch_lot_number || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.low_stock_alert !== null && item.current_quantity <= item.low_stock_alert && (
                        <div className="flex items-center gap-1 text-red-400 text-sm">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </div>
                      )}
                      {item.current_quantity === 0 && (
                        <div className="flex items-center gap-1 text-yellow-400 text-sm">
                          <Package className="h-3 w-3" />
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onDelete(item.id, item.name)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredAndSortedInventory.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            {searchTerm ? 'No inventory items found' : 'No inventory items yet'}
          </h3>
          <p className="text-gray-400">
            {searchTerm ? 'Try adjusting your search terms' : 'Add your first inventory item to start tracking stock.'}
          </p>
        </motion.div>
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        items={filteredAndSortedInventory.filter(item => selectedItems.has(item.id))}
        onSuccess={() => {
          setSelectedItems(new Set())
          setShowBulkEditModal(false)
        }}
      />
    </div>
  )
} 