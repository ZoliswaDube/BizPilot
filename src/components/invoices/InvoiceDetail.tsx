import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Edit, 
  Send, 
  Download, 
  Printer,
  CheckCircle,
  FileText,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useBusiness } from '../../hooks/useBusiness'
import { useInvoices } from '../../hooks/useInvoices'
import { formatCurrency } from '../../utils/calculations'
import { supabase } from '../../lib/supabase'
import type { InvoiceWithItems, InvoiceStatus } from '../../types/payments'

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-900/30 text-gray-400 border-gray-500/30',
  sent: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
  viewed: 'bg-purple-900/30 text-purple-400 border-purple-500/30',
  paid: 'bg-green-900/30 text-green-400 border-green-500/30',
  overdue: 'bg-red-900/30 text-red-400 border-red-500/30',
  cancelled: 'bg-gray-900/30 text-gray-400 border-gray-500/30',
  refunded: 'bg-orange-900/30 text-orange-400 border-orange-500/30'
}

export function InvoiceDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()
  const { business, userRole, hasPermission } = useBusiness()
  const { sendInvoice, generateInvoicePDF } = useInvoices()

  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const canEdit = hasPermission('invoices', 'update') || userRole === 'admin' || userRole === 'manager'

  useEffect(() => {
    if (id && business?.id) {
      loadInvoice(id)
    }
  }, [id, business?.id])

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true)
      setError('')

      const { data, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*),
          customer:customers(id, name, email, phone, address)
        `)
        .eq('id', invoiceId)
        .eq('business_id', business?.id)
        .single()

      if (invoiceError) throw invoiceError
      if (!data) throw new Error('Invoice not found')

      setInvoice(data)
    } catch (err) {
      console.error('Error loading invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvoice = async () => {
    if (!invoice) return

    if (window.confirm(`Send invoice ${invoice.invoice_number} to ${invoice.customer?.name}?`)) {
      try {
        setActionLoading('send')
        await sendInvoice(invoice.id)
        alert('Invoice sent successfully!')
        await loadInvoice(invoice.id) // Reload to get updated status
      } catch (err) {
        console.error('Failed to send invoice:', err)
        alert('Failed to send invoice. Please try again.')
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return

    try {
      setActionLoading('download')
      const pdfUrl = await generateInvoicePDF(invoice.id)
      if (pdfUrl) {
        window.open(pdfUrl, '_blank')
      } else {
        alert('Failed to generate PDF. Please try again.')
      }
    } catch (err) {
      console.error('Failed to download PDF:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatAddress = (address: any) => {
    if (!address) return 'N/A'
    if (typeof address === 'string') return address
    
    const parts = [
      address.line1,
      address.line2,
      address.street,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean)
    
    return parts.join(', ') || 'N/A'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-400">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="card bg-red-900/20 border-red-500/30">
        <div className="text-red-400">
          <h3 className="font-medium">Error loading invoice</h3>
          <p className="text-sm mt-1">{error || 'Invoice not found'}</p>
          <button
            onClick={() => navigate('/invoices')}
            className="mt-4 btn-secondary"
          >
            Back to Invoices
          </button>
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
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 text-gray-400 hover:text-gray-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Invoice {invoice.invoice_number}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${STATUS_COLORS[invoice.status]}`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
              {invoice.status === 'overdue' && (
                <span className="text-sm text-red-400">
                  Overdue since {formatDate(invoice.due_date)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {canEdit && invoice.status === 'draft' && (
            <button
              onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}

          {invoice.status === 'draft' && (
            <button
              onClick={handleSendInvoice}
              disabled={actionLoading === 'send'}
              className="btn-primary flex items-center space-x-2"
            >
              {actionLoading === 'send' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Send Invoice</span>
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={actionLoading === 'download'}
            className="btn-secondary flex items-center space-x-2"
          >
            {actionLoading === 'download' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-secondary flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="card bg-white text-gray-900 p-8 print:shadow-none print:p-0">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          {/* Business Info */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{business?.name || 'Your Business'}</h2>
            <p className="text-gray-600 mt-2">{business?.email || ''}</p>
            <p className="text-gray-600">{business?.phone || ''}</p>
            <p className="text-gray-600">{business?.address || ''}</p>
          </div>

          {/* Invoice Info */}
          <div className="text-right">
            <div className="text-4xl font-bold text-primary-600 mb-2">INVOICE</div>
            <div className="text-gray-600">
              <p className="font-semibold">#{invoice.invoice_number}</p>
              <p className="text-sm mt-1">Date: {formatDate(invoice.issue_date)}</p>
              <p className="text-sm">Due: {formatDate(invoice.due_date)}</p>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Bill To</h3>
          <div className="text-gray-900">
            <p className="font-semibold text-lg">{invoice.customer?.name || 'N/A'}</p>
            {invoice.customer?.email && (
              <p className="text-gray-600 flex items-center space-x-2 mt-1">
                <Mail className="h-4 w-4" />
                <span>{invoice.customer.email}</span>
              </p>
            )}
            {invoice.customer?.phone && (
              <p className="text-gray-600 flex items-center space-x-2 mt-1">
                <Phone className="h-4 w-4" />
                <span>{invoice.customer.phone}</span>
              </p>
            )}
            {invoice.customer?.address && (
              <p className="text-gray-600 flex items-center space-x-2 mt-1">
                <MapPin className="h-4 w-4" />
                <span>{formatAddress(invoice.customer.address)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Qty</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Discount</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Tax</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-gray-900">{item.description}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {item.discount_percentage > 0 ? `${item.discount_percentage}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {item.tax_percentage > 0 ? `${item.tax_percentage}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(item.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Discount:</span>
                <span>-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700">
              <span>Tax (VAT):</span>
              <span>{formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-300 pt-2">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
            {invoice.amount_paid > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Amount Paid:</span>
                  <span>-{formatCurrency(invoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-red-600 border-t border-gray-300 pt-2">
                  <span>Amount Due:</span>
                  <span>{formatCurrency(invoice.amount_due)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms || invoice.payment_instructions) && (
          <div className="border-t border-gray-300 pt-6 space-y-4">
            {invoice.notes && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Notes</h4>
                <p className="text-gray-600 text-sm">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Terms & Conditions</h4>
                <p className="text-gray-600 text-sm">{invoice.terms}</p>
              </div>
            )}
            {invoice.payment_instructions && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Payment Instructions</h4>
                <p className="text-gray-600 text-sm">{invoice.payment_instructions}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-300 text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
          {business?.email && (
            <p className="mt-1">Questions? Contact us at {business.email}</p>
          )}
        </div>
      </div>

      {/* Payment Status */}
      {invoice.status === 'paid' && (
        <div className="card bg-green-900/20 border-green-500/30 print:hidden">
          <div className="flex items-center space-x-3 text-green-400">
            <CheckCircle className="h-6 w-6" />
            <div>
              <p className="font-medium">Invoice Paid</p>
              {invoice.paid_date && (
                <p className="text-sm text-green-400/80">
                  Paid on {formatDate(invoice.paid_date)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
