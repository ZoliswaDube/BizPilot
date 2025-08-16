import React, { useState, useEffect } from 'react'
import { X, Plus, Minus, Search } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { useCustomers } from '../../hooks/useCustomers'
import { useInventory } from '../../hooks/useInventory'
import type { Customer, CreateOrderRequest, CreateOrderItemRequest } from '../../types/orders'

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
  const { createOrder } = useOrders()
  const { customers } = useCustomers()
  const { inventory } = useInventory()
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [items, setItems] = useState<CreateOrderItemRequest[]>([
    { product_name: '', quantity: 1, unit_price: 0 }
  ])
  const [notes, setNotes] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search customers as user types
  useEffect(() => {
    const searchDelay = setTimeout(() => {
      if (customerSearch.trim().length >= 2) {
        const term = customerSearch.toLowerCase()
        const results = customers.filter(c =>
          c.name.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.phone?.toLowerCase().includes(term)
        )
        setSearchResults(results)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(searchDelay)
  }, [customerSearch, customers])

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: 1, unit_price: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof CreateOrderItemRequest, value: any) => {
    setItems(items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const selectInventoryItem = (index: number, inventoryItem: any) => {
    updateItem(index, 'inventory_id', inventoryItem.id)
    updateItem(index, 'product_id', inventoryItem.product_id)
    updateItem(index, 'product_name', inventoryItem.name)
    updateItem(index, 'unit_price', parseFloat(inventoryItem.cost_per_unit || 0))
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * 0.15 // 15% VAT
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate items
      const validItems = items.filter(item => 
        item.product_name.trim() && item.quantity > 0 && item.unit_price >= 0
      )

      if (validItems.length === 0) {
        throw new Error('Please add at least one valid item')
      }

      const orderData: CreateOrderRequest = {
        customer_id: selectedCustomer?.id,
        notes: notes.trim() || undefined,
        estimated_delivery_date: deliveryDate || undefined,
        items: validItems
      }

      const result = await createOrder(orderData)
      if (result) {
        onSuccess()
        resetForm()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedCustomer(null)
    setCustomerSearch('')
    setSearchResults([])
    setItems([{ product_name: '', quantity: 1, unit_price: 0 }])
    setNotes('')
    setOrderDate(new Date().toISOString().split('T')[0])
    setDeliveryDate('')
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create New Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Customer Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer (Optional)
            </label>
            
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div>
                  <div className="font-medium">{selectedCustomer.name}</div>
                  {selectedCustomer.email && (
                    <div className="text-sm text-gray-600">{selectedCustomer.email}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {searchResults.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setCustomerSearch('')
                          setSearchResults([])
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{customer.name}</div>
                        {customer.email && (
                          <div className="text-sm text-gray-600">{customer.email}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Order Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.product_name}
                        onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter product name"
                      />
                      
                      {/* Inventory suggestions */}
                      {inventory.length > 0 && (
                        <div className="mt-2">
                          <select
                            onChange={(e) => {
                              const inventoryItem = inventory.find(inv => inv.id === e.target.value)
                              if (inventoryItem) {
                                selectInventoryItem(index, inventoryItem)
                              }
                            }}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">Select from inventory</option>
                            {inventory.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} (Stock: {inv.current_quantity})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit Price (R) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-2 text-right">
                    <span className="text-sm font-medium">
                      Item Total: R{(item.quantity * item.unit_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date *
              </label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date (Optional)
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Add any special instructions or notes..."
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (15%):</span>
                <span>R{calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>R{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
