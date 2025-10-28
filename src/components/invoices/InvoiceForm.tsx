import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Save, Loader2, Calendar } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useBusiness } from '../../hooks/useBusiness'
import { useInvoices } from '../../hooks/useInvoices'
import { useCustomers } from '../../hooks/useCustomers'
import { formatCurrency } from '../../utils/calculations'
import { supabase } from '../../lib/supabase'
import type { CreateInvoiceItemRequest } from '../../types/payments'

interface InvoiceFormData {
  customer_id: string
  issue_date: string
  due_date: string
  notes: string
  terms: string
  payment_instructions: string
  items: InvoiceItemData[]
}

interface InvoiceItemData extends CreateInvoiceItemRequest {
  id?: string
  tempId?: string
}

export function InvoiceForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()
  const { business } = useBusiness()
  const { createInvoice, updateInvoice } = useInvoices()
  const { customers, loading: customersLoading } = useCustomers()

  const isEditMode = !!id
  const [loading, setLoading] = useState(isEditMode)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<InvoiceFormData>({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    terms: 'Payment due within 30 days',
    payment_instructions: 'Please pay by bank transfer to the account details below.',
    items: [
      {
        tempId: '1',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0,
        tax_percentage: 15 // Default VAT for South Africa
      }
    ]
  })

  // Products for autocomplete
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Load products for autocomplete
  useEffect(() => {
    const loadProducts = async () => {
      if (!business?.id) return

      try {
        setLoadingProducts(true)
        const { data, error } = await supabase
          .from('products')
          .select('id, name, selling_price')
          .eq('business_id', business.id)
          .order('name')

        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        console.error('Error loading products:', err)
      } finally {
        setLoadingProducts(false)
      }
    }

    loadProducts()
  }, [business?.id])

  // Load invoice data if editing
  useEffect(() => {
    if (isEditMode && id && business?.id) {
      loadInvoiceData(id)
    }
  }, [isEditMode, id, business?.id])

  const loadInvoiceData = async (invoiceId: string) => {
    try {
      setLoading(true)
      setError('')

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `)
        .eq('id', invoiceId)
        .eq('business_id', business?.id)
        .single()

      if (invoiceError) throw invoiceError
      if (!invoice) throw new Error('Invoice not found')

      // Can only edit draft invoices
      if (invoice.status !== 'draft') {
        throw new Error('Only draft invoices can be edited')
      }

      setFormData({
        customer_id: invoice.customer_id || '',
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        payment_instructions: invoice.payment_instructions || '',
        items: invoice.items.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
          tax_percentage: item.tax_percentage
        }))
      })
    } catch (err) {
      console.error('Error loading invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (index: number, field: keyof InvoiceItemData, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          tempId: Date.now().toString(),
          description: '',
          quantity: 1,
          unit_price: 0,
          discount_percentage: 0,
          tax_percentage: 15
        }
      ]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length === 1) {
      setError('Invoice must have at least one item')
      return
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const selectProduct = (index: number, product: any) => {
    handleItemChange(index, 'product_id', product.id)
    handleItemChange(index, 'description', product.name)
    handleItemChange(index, 'unit_price', product.selling_price || 0)
  }

  const calculateItemTotal = (item: InvoiceItemData) => {
    const subtotal = item.quantity * item.unit_price
    const discount = subtotal * (item.discount_percentage || 0) / 100
    const taxable = subtotal - discount
    const tax = taxable * (item.tax_percentage || 0) / 100
    return taxable + tax
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const discount = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price
      return sum + (itemSubtotal * (item.discount_percentage || 0) / 100)
    }, 0)
    const taxable = subtotal - discount
    const tax = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price
      const itemDiscount = itemSubtotal * (item.discount_percentage || 0) / 100
      const itemTaxable = itemSubtotal - itemDiscount
      return sum + (itemTaxable * (item.tax_percentage || 0) / 100)
    }, 0)
    const total = taxable + tax

    return { subtotal, discount, tax, total }
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.customer_id) {
      errors.push('Please select a customer')
    }

    if (!formData.issue_date) {
      errors.push('Issue date is required')
    }

    if (!formData.due_date) {
      errors.push('Due date is required')
    }

    if (new Date(formData.due_date) < new Date(formData.issue_date)) {
      errors.push('Due date must be after issue date')
    }

    if (formData.items.length === 0) {
      errors.push('Invoice must have at least one item')
    }

    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        errors.push(`Item ${index + 1}: Description is required`)
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
      }
      if (item.unit_price < 0) {
        errors.push(`Item ${index + 1}: Unit price cannot be negative`)
      }
    })

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !business) {
      setError('User not authenticated or no business found')
      return
    }

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const invoiceData = {
        customer_id: formData.customer_id,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        notes: formData.notes.trim() || undefined,
        terms: formData.terms.trim() || undefined,
        payment_instructions: formData.payment_instructions.trim() || undefined,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage || 0,
          tax_percentage: item.tax_percentage || 15
        }))
      }

      if (isEditMode && id) {
        // For edit mode, we can only update certain fields
        await updateInvoice(id, {
          due_date: invoiceData.due_date,
          notes: invoiceData.notes,
          terms: invoiceData.terms,
          payment_instructions: invoiceData.payment_instructions
        })

        // Delete existing items
        await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id)

        // Insert new items
        const itemsToInsert = invoiceData.items.map(item => ({
          invoice_id: id,
          ...item
        }))

        await supabase
          .from('invoice_items')
          .insert(itemsToInsert)

        navigate('/invoices')
      } else {
        await createInvoice(invoiceData)
        navigate('/invoices')
      }
    } catch (err) {
      console.error('Error saving invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to save invoice')
    } finally {
      setSubmitting(false)
    }
  }

  const totals = calculateTotals()

  if (loading || customersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 text-gray-400 hover:text-gray-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {isEditMode ? 'Edit Invoice' : 'Create Invoice'}
            </h1>
            <p className="text-gray-400 mt-1">
              {isEditMode ? 'Update invoice details' : 'Create a new invoice for your customer'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card bg-red-900/20 border-red-500/30">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Invoice Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Customer *
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => handleInputChange('customer_id', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Issue Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => handleInputChange('issue_date', e.target.value)}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Due Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Line Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={item.id || item.tempId} className="p-4 bg-dark-800 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-gray-400">Item {index + 1}</span>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Product Selection */}
                {products.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Product (Optional)
                    </label>
                    <select
                      onChange={(e) => {
                        const product = products.find(p => p.id === e.target.value)
                        if (product) selectProduct(index, product)
                      }}
                      className="input-field"
                    >
                      <option value="">Choose a product...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.selling_price || 0)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="input-field"
                    placeholder="Item description"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Discount % */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Discount %
                    </label>
                    <input
                      type="number"
                      value={item.discount_percentage || 0}
                      onChange={(e) => handleItemChange(index, 'discount_percentage', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>

                  {/* Tax % */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tax % (VAT)
                    </label>
                    <input
                      type="number"
                      value={item.tax_percentage || 15}
                      onChange={(e) => handleItemChange(index, 'tax_percentage', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>

                  {/* Total */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Total
                    </label>
                    <div className="input-field bg-dark-900 text-gray-400">
                      {formatCurrency(calculateItemTotal(item))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div className="mt-6 border-t border-dark-700 pt-4">
            <div className="max-w-sm ml-auto space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Discount:</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tax (VAT):</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-100 border-t border-dark-700 pt-2">
                <span>Total:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Additional Details</h2>
          
          <div className="space-y-4">
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Additional notes for this invoice..."
              />
            </div>

            {/* Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Payment terms..."
              />
            </div>

            {/* Payment Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Instructions
              </label>
              <textarea
                value={formData.payment_instructions}
                onChange={(e) => handleInputChange('payment_instructions', e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Payment instructions..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>{isEditMode ? 'Update Invoice' : 'Create Invoice'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
