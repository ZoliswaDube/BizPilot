import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  User, 
  Package, 
  Calculator,
  AlertTriangle,
  Search,
  MapPin,
  CreditCard,
  Calendar,
  Loader2
} from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { useOrder } from '../../hooks/useOrder'
import { useCustomers } from '../../hooks/useCustomers'
// Products are sourced from inventory/products APIs; use inventory hook for product data
import { useInventory } from '../../hooks/useInventory'
import type { 
  CreateOrderRequest, 
  CreateOrderItemRequest, 
  UpdateOrderRequest,
  Customer,
  Product,
  InventoryItem,
  Address,
  InventoryValidation
} from '../../types/orders'
import { validateOrder, validateOrderItem } from '../../utils/orderValidation'
import { formatCurrency } from '../../utils/calculations'

interface OrderFormProps {
  orderId?: string
  onSave?: (order: any) => void
  onCancel?: () => void
}

export function OrderForm({ orderId, onSave, onCancel }: OrderFormProps) {
  const navigate = useNavigate()
  const params = useParams()
  const isEditing = !!(orderId || params.id)
  const currentOrderId = orderId || params.id

  // Hooks
  const { createOrder, updateOrder, validateInventory, calculateOrderTotal } = useOrders()
  const { order, loading: orderLoading } = useOrder(currentOrderId || '')
  const { customers } = useCustomers()
  const { inventory } = useInventory()
  const products = inventory.map((i: any) => ({ id: i.product_id || i.id, name: i.name }))

  // Form state
  const [formData, setFormData] = useState<CreateOrderRequest>({
    items: [],
    notes: '',
    shipping_address: undefined,
    billing_address: undefined,
    estimated_delivery_date: '',
    payment_method: '',
    discount_amount: 0
  })

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  
  const [validationErrors, setValidationErrors] = useState<any>({})
  const [inventoryValidation, setInventoryValidation] = useState<InventoryValidation | null>(null)
  const [orderTotals, setOrderTotals] = useState({
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load existing order data for editing
  useEffect(() => {
    if (isEditing && order && !orderLoading) {
      setFormData({
        customer_id: order.customer_id,
        items: [], // Will be loaded separately
        notes: order.notes || '',
        shipping_address: order.shipping_address,
        billing_address: order.billing_address,
        estimated_delivery_date: order.estimated_delivery_date || '',
        payment_method: order.payment_method || '',
        discount_amount: order.discount_amount || 0
      })

      // Find and set selected customer
      if (order.customer_id) {
        const customer = customers.find(c => c.id === order.customer_id)
        if (customer) {
          setSelectedCustomer(customer)
        }
      }
    }
  }, [isEditing, order, orderLoading, customers])

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm) return customers.slice(0, 10)
    
    const term = customerSearchTerm.toLowerCase()
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.company?.toLowerCase().includes(term)
    ).slice(0, 10)
  }, [customers, customerSearchTerm])

  // Filter products and inventory for search
  const searchableItems = useMemo(() => {
    const items: Array<{ type: 'product' | 'inventory', item: Product | InventoryItem | Record<string, any> }> = []
    
    products.forEach(product => {
      items.push({ type: 'product', item: product })
    })
    
    inventory.forEach(inv => {
      items.push({ type: 'inventory', item: inv })
    })
    
    if (!productSearchTerm) return items.slice(0, 10)
    
    const term = productSearchTerm.toLowerCase()
    return items.filter(({ item }) =>
      item.name.toLowerCase().includes(term) ||
      (('sku' in item) && typeof (item as any).sku === 'string' && (item as any).sku.toLowerCase().includes(term)) ||
      (('barcode' in item) && typeof (item as any).barcode === 'string' && (item as any).barcode.toLowerCase().includes(term))
    ).slice(0, 10)
  }, [products, inventory, productSearchTerm])

  // Calculate totals when items or discount change
  useEffect(() => {
    const calculateTotals = async () => {
      if (formData.items.length > 0) {
        try {
          const totals = await calculateOrderTotal(formData.items, formData.discount_amount)
          setOrderTotals(totals)
        } catch (err) {
          console.error('Error calculating totals:', err)
        }
      } else {
        setOrderTotals({
          subtotal: 0,
          tax_amount: 0,
          discount_amount: formData.discount_amount || 0,
          total_amount: 0
        })
      }
    }

    calculateTotals()
  }, [formData.items, formData.discount_amount, calculateOrderTotal])

  // Validate inventory when items change
  useEffect(() => {
    const validateItems = async () => {
      if (formData.items.length > 0) {
        try {
          const validation = await validateInventory(formData.items)
          setInventoryValidation(validation)
        } catch (err) {
          console.error('Error validating inventory:', err)
        }
      } else {
        setInventoryValidation(null)
      }
    }

    validateItems()
  }, [formData.items, validateInventory])

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData(prev => ({ ...prev, customer_id: customer.id }))
    setShowCustomerSearch(false)
    setCustomerSearchTerm('')
  }

  const handleAddItem = (type: 'product' | 'inventory', item: Product | InventoryItem) => {
    const newItem: CreateOrderItemRequest = {
      product_id: type === 'product' ? item.id : undefined,
      inventory_id: type === 'inventory' ? item.id : undefined,
      product_name: item.name,
      quantity: 1,
      unit_price: type === 'product' ? (item as Product).selling_price || 0 : (item as InventoryItem).cost_per_unit || 0
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
    
    setShowProductSearch(false)
    setProductSearchTerm('')
  }

  const handleUpdateItem = (index: number, updates: Partial<CreateOrderItemRequest>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      )
    }))
  }

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleAddressChange = (type: 'shipping' | 'billing', field: keyof Address, value: string) => {
    const addressField = type === 'shipping' ? 'shipping_address' : 'billing_address'
    
    setFormData(prev => ({
      ...prev,
      [addressField]: {
        ...prev[addressField],
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const validation = validateOrder(formData)
    if (!validation.isValid) {
      const errors: any = {}
      validation.errors.forEach(error => {
        errors[error.field] = error.message
      })
      setValidationErrors(errors)
      return
    }

    // Check inventory validation
    if (inventoryValidation && !inventoryValidation.isValid) {
      setError('Please resolve inventory issues before saving the order')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let result
      if (isEditing && currentOrderId) {
        // Update existing order
        const updates: UpdateOrderRequest = {
          notes: formData.notes,
          shipping_address: formData.shipping_address,
          billing_address: formData.billing_address,
          estimated_delivery_date: formData.estimated_delivery_date,
          payment_method: formData.payment_method,
          discount_amount: formData.discount_amount
        }
        result = await updateOrder(currentOrderId, updates)
      } else {
        // Create new order
        result = await createOrder(formData)
      }

      if (onSave) {
        onSave(result)
      } else {
        navigate('/orders')
      }
    } catch (err) {
      console.error('Error saving order:', err)
      setError(err instanceof Error ? err.message : 'Failed to save order')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate('/orders')
    }
  }

  if (isEditing && orderLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-400">Loading order...</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            {isEditing ? 'Edit Order' : 'Create New Order'}
          </h1>
          <p className="text-gray-400">
            {isEditing ? 'Update order details and items' : 'Add items and customer information'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="btn-secondary flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || formData.items.length === 0}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isEditing ? 'Update Order' : 'Create Order'}</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card bg-red-900/20 border-red-500/30">
          <div className="flex items-center text-red-400">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Inventory Validation Warnings */}
      {inventoryValidation && !inventoryValidation.isValid && (
        <div className="card bg-red-900/20 border-red-500/30">
          <div className="text-red-400">
            <h3 className="font-medium flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Inventory Issues
            </h3>
            <ul className="mt-2 space-y-1">
              {inventoryValidation.errors.map((error, index) => (
                <li key={index} className="text-sm">• {error.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Inventory Warnings */}
      {inventoryValidation && inventoryValidation.warnings.length > 0 && (
        <div className="card bg-yellow-900/20 border-yellow-500/30">
          <div className="text-yellow-400">
            <h3 className="font-medium flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Inventory Warnings
            </h3>
            <ul className="mt-2 space-y-1">
              {inventoryValidation.warnings.map((warning, index) => (
                <li key={index} className="text-sm">• {warning.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Customer Information
          </h2>
          
          <div className="space-y-4">
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg border border-dark-600">
                <div>
                  <p className="font-medium text-gray-100">{selectedCustomer.name}</p>
                  {selectedCustomer.email && (
                    <p className="text-sm text-gray-400">{selectedCustomer.email}</p>
                  )}
                  {selectedCustomer.company && (
                    <p className="text-sm text-gray-400">{selectedCustomer.company}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null)
                    setFormData(prev => ({ ...prev, customer_id: undefined }))
                  }}
                  className="text-gray-400 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                  className="w-full p-3 border border-dark-600 rounded-lg text-left text-gray-400 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-center">
                    <Search className="h-4 w-4 mr-2" />
                    <span>Search for customer or leave blank for walk-in</span>
                  </div>
                </button>

                {showCustomerSearch && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg">
                    <div className="p-3 border-b border-dark-600">
                      <input
                        type="text"
                        placeholder="Search customers..."
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        className="input w-full"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredCustomers.map(customer => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full p-3 text-left hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-b-0"
                        >
                          <p className="font-medium text-gray-100">{customer.name}</p>
                          {customer.email && (
                            <p className="text-sm text-gray-400">{customer.email}</p>
                          )}
                          {customer.company && (
                            <p className="text-sm text-gray-400">{customer.company}</p>
                          )}
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <div className="p-3 text-center text-gray-400">
                          No customers found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Order Items
            </h2>
            <button
              type="button"
              onClick={() => setShowProductSearch(!showProductSearch)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </button>
          </div>

          {/* Product Search */}
          {showProductSearch && (
            <div className="mb-4 p-4 bg-dark-800 rounded-lg border border-dark-600">
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search products or inventory..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="input w-full"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchableItems.map(({ type, item }, index) => (
                  <button
                    key={`${type}-${item.id}`}
                    type="button"
                    onClick={() => handleAddItem(type, item as Product | InventoryItem)}
                    className="w-full p-3 text-left hover:bg-dark-700 transition-colors rounded-lg border border-dark-600"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-100">{item.name}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="capitalize">{type}</span>
                          {('sku' in item) && (item as any).sku && <span>SKU: {(item as any).sku}</span>}
                          {type === 'inventory' && (
                            <span>Stock: {(item as InventoryItem).current_quantity}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-100">
                          {formatCurrency(
                            type === 'product' 
                              ? (item as Product).selling_price || 0 
                              : (item as InventoryItem).cost_per_unit || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {searchableItems.length === 0 && (
                  <div className="p-3 text-center text-gray-400">
                    No items found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items List */}
          {formData.items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items added yet</p>
              <p className="text-sm">Click "Add Item" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="p-4 bg-dark-800 rounded-lg border border-dark-600">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={item.product_name}
                        onChange={(e) => handleUpdateItem(index, { product_name: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleUpdateItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total</p>
                        <p className="font-medium text-gray-100">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Totals */}
        {formData.items.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Order Summary
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_amount || 0}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      discount_amount: parseFloat(e.target.value) || 0 
                    }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-dark-600 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(orderTotals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Tax (10%):</span>
                    <span>{formatCurrency(orderTotals.tax_amount)}</span>
                  </div>
                  {orderTotals.discount_amount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount:</span>
                      <span>-{formatCurrency(orderTotals.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold text-gray-100 border-t border-dark-600 pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(orderTotals.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Shipping Address
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Street Address"
                value={formData.shipping_address?.street || ''}
                onChange={(e) => handleAddressChange('shipping', 'street', e.target.value)}
                className="input w-full"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.shipping_address?.city || ''}
                  onChange={(e) => handleAddressChange('shipping', 'city', e.target.value)}
                  className="input w-full"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.shipping_address?.state || ''}
                  onChange={(e) => handleAddressChange('shipping', 'state', e.target.value)}
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={formData.shipping_address?.postal_code || ''}
                  onChange={(e) => handleAddressChange('shipping', 'postal_code', e.target.value)}
                  className="input w-full"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={formData.shipping_address?.country || ''}
                  onChange={(e) => handleAddressChange('shipping', 'country', e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Order Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Estimated Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.estimated_delivery_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_delivery_date: e.target.value }))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Order Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any special instructions or notes..."
                  rows={4}
                  className="input w-full resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  )
}