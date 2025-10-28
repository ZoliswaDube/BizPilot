import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Loader2, DollarSign, Calendar } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useBusiness } from '../../hooks/useBusiness'
import { usePayments } from '../../hooks/usePayments'
import { useInvoices } from '../../hooks/useInvoices'
import { formatCurrency } from '../../utils/calculations'
import { supabase } from '../../lib/supabase'
import type { PaymentProvider } from '../../types/payments'

interface PaymentFormData {
  invoice_id: string
  amount: string
  provider: PaymentProvider | ''
  payment_method_id: string
  description: string
  provider_payment_id: string
  currency: string
}

// South African payment providers
const SA_PAYMENT_PROVIDERS: Array<{ value: PaymentProvider; label: string }> = [
  { value: 'eft', label: 'EFT / Bank Transfer' },
  { value: 'payfast', label: 'PayFast' },
  { value: 'yoco', label: 'Yoco' },
  { value: 'ozow', label: 'Ozow' },
  { value: 'snapscan', label: 'SnapScan' },
  { value: 'zapper', label: 'Zapper' },
  { value: 'manual', label: 'Manual / Cash' }
]

export function PaymentForm() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { business } = useBusiness()
  const { createPayment } = usePayments()
  const { invoices, loading: invoicesLoading } = useInvoices()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loadingMethods, setLoadingMethods] = useState(false)

  const [formData, setFormData] = useState<PaymentFormData>({
    invoice_id: '',
    amount: '',
    provider: '',
    payment_method_id: '',
    description: '',
    provider_payment_id: '',
    currency: 'ZAR'
  })

  // Load payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!business?.id) return

      try {
        setLoadingMethods(true)
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('business_id', business.id)
          .eq('is_active', true)
          .order('is_default', { ascending: false })

        if (error) throw error
        setPaymentMethods(data || [])
      } catch (err) {
        console.error('Error loading payment methods:', err)
      } finally {
        setLoadingMethods(false)
      }
    }

    loadPaymentMethods()
  }, [business?.id])

  // Auto-fill amount when invoice is selected
  useEffect(() => {
    if (formData.invoice_id) {
      const selectedInvoice = invoices.find(inv => inv.id === formData.invoice_id)
      if (selectedInvoice && selectedInvoice.amount_due > 0) {
        setFormData(prev => ({
          ...prev,
          amount: selectedInvoice.amount_due.toString()
        }))
      }
    }
  }, [formData.invoice_id, invoices])

  const handleInputChange = (field: keyof PaymentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.push('Amount must be greater than 0')
    }

    if (!formData.provider) {
      errors.push('Payment provider is required')
    }

    if (!formData.currency) {
      errors.push('Currency is required')
    }

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
      const paymentData = {
        invoice_id: formData.invoice_id || undefined,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        provider: formData.provider as PaymentProvider,
        payment_method_id: formData.payment_method_id || undefined,
        description: formData.description.trim() || undefined,
        metadata: {
          provider_payment_id: formData.provider_payment_id || undefined
        }
      }

      await createPayment(paymentData)
      navigate('/payments')
    } catch (err) {
      console.error('Error recording payment:', err)
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter unpaid and partially paid invoices
  const unpaidInvoices = invoices.filter(inv => 
    inv.amount_due > 0 && ['sent', 'viewed', 'overdue'].includes(inv.status)
  )

  if (invoicesLoading || loadingMethods) {
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
            onClick={() => navigate('/payments')}
            className="p-2 text-gray-400 hover:text-gray-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Record Payment</h1>
            <p className="text-gray-400 mt-1">Record a manual or offline payment</p>
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
        {/* Payment Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Payment Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoice (Optional) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Invoice (Optional)
              </label>
              <select
                value={formData.invoice_id}
                onChange={(e) => handleInputChange('invoice_id', e.target.value)}
                className="input-field"
              >
                <option value="">No invoice - standalone payment</option>
                <optgroup label="Unpaid Invoices">
                  {unpaidInvoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {invoice.customer?.name || 'No customer'} - {formatCurrency(invoice.amount_due)} due
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select an invoice to link this payment, or leave blank for a standalone payment
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="input-field pl-10"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Currency *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="input-field"
                required
              >
                <option value="ZAR">ZAR (South African Rand)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
              </select>
            </div>

            {/* Payment Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Provider *
              </label>
              <select
                value={formData.provider}
                onChange={(e) => handleInputChange('provider', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select provider...</option>
                {SA_PAYMENT_PROVIDERS.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            {paymentMethods.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method (Optional)
                </label>
                <select
                  value={formData.payment_method_id}
                  onChange={(e) => handleInputChange('payment_method_id', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select method...</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.type.toUpperCase()} - {method.bank_name || method.brand || method.provider} 
                      {method.last4 && ` ****${method.last4}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Provider Payment ID */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Provider Payment ID (Optional)
              </label>
              <input
                type="text"
                value={formData.provider_payment_id}
                onChange={(e) => handleInputChange('provider_payment_id', e.target.value)}
                className="input-field"
                placeholder="e.g., Transaction reference, PayFast ID, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                External reference number from payment provider
              </p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Payment notes or description..."
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        {formData.amount && parseFloat(formData.amount) > 0 && (
          <div className="card bg-primary-900/10 border-primary-500/30">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Amount:</span>
                <span className="text-gray-200 font-medium">
                  {formatCurrency(parseFloat(formData.amount))} {formData.currency}
                </span>
              </div>
              {formData.invoice_id && (
                <div className="flex justify-between text-gray-400">
                  <span>Linked Invoice:</span>
                  <span className="text-primary-400">
                    {unpaidInvoices.find(inv => inv.id === formData.invoice_id)?.invoice_number || 'N/A'}
                  </span>
                </div>
              )}
              {formData.provider && (
                <div className="flex justify-between text-gray-400">
                  <span>Provider:</span>
                  <span className="text-gray-200">
                    {SA_PAYMENT_PROVIDERS.find(p => p.value === formData.provider)?.label || formData.provider}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/payments')}
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
                <span>Recording...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Record Payment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
