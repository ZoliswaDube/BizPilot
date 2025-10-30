import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  CreditCard,
  FileText,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { useBusiness } from '../../hooks/useBusiness'
import { useCurrency } from '../../hooks/useCurrency'
import { supabase } from '../../lib/supabase'
import type { Payment, PaymentStatus } from '../../types/payments'

const STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  processing: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
  succeeded: 'bg-green-900/30 text-green-400 border-green-500/30',
  failed: 'bg-red-900/30 text-red-400 border-red-500/30',
  refunded: 'bg-orange-900/30 text-orange-400 border-orange-500/30',
  cancelled: 'bg-gray-900/30 text-gray-400 border-gray-500/30'
}

const STATUS_ICONS: Record<PaymentStatus, React.ComponentType<any>> = {
  pending: Clock,
  processing: RefreshCw,
  succeeded: CheckCircle,
  failed: XCircle,
  refunded: DollarSign,
  cancelled: XCircle
}

const PROVIDER_NAMES: Record<string, string> = {
  payfast: 'PayFast',
  yoco: 'Yoco',
  ozow: 'Ozow',
  snapscan: 'SnapScan',
  zapper: 'Zapper',
  stripe: 'Stripe',
  manual: 'Manual',
  eft: 'EFT',
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer'
}

export function PaymentDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { business } = useBusiness()
  const { format: formatCurrency, formatDate } = useCurrency()

  const [payment, setPayment] = useState<Payment | null>(null)
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id && business?.id) {
      loadPaymentData(id)
    }
  }, [id, business?.id])

  const loadPaymentData = async (paymentId: string) => {
    try {
      setLoading(true)
      setError('')

      // Load payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .eq('business_id', business?.id)
        .single()

      if (paymentError) throw paymentError
      if (!paymentData) throw new Error('Payment not found')

      setPayment(paymentData)

      // Load linked invoice if exists
      if (paymentData.invoice_id) {
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('invoice_number, total_amount, status, customer:customers(name)')
          .eq('id', paymentData.invoice_id)
          .single()

        if (invoiceData) {
          setInvoice(invoiceData)
        }
      }
    } catch (err) {
      console.error('Error loading payment:', err)
      setError(err instanceof Error ? err.message : 'Failed to load payment')
    } finally {
      setLoading(false)
    }
  }

  // Remove duplicate formatDate - using the one from useCurrency hook

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-400">Loading payment...</p>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="card bg-red-900/20 border-red-500/30">
        <div className="text-red-400">
          <h3 className="font-medium">Error loading payment</h3>
          <p className="text-sm mt-1">{error || 'Payment not found'}</p>
          <button
            onClick={() => navigate('/payments')}
            className="mt-4 btn-secondary"
          >
            Back to Payments
          </button>
        </div>
      </div>
    )
  }

  const StatusIcon = STATUS_ICONS[payment.status]
  const netAmount = payment.amount - payment.refund_amount

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
            <h1 className="text-2xl font-bold text-gray-100">Payment {payment.payment_number}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border ${STATUS_COLORS[payment.status]}`}>
                <StatusIcon className="h-3 w-3" />
                <span>{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Card */}
      <div className="card bg-gradient-to-br from-primary-900/20 to-accent-900/20 border-primary-500/30">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-2">Payment Amount</div>
          <div className="text-4xl font-bold text-gray-100 mb-2">
            {formatCurrency(payment.amount)}
          </div>
          {payment.refund_amount > 0 && (
            <div className="text-sm space-y-1">
              <div className="text-orange-400">
                Refunded: {formatCurrency(payment.refund_amount)}
              </div>
              <div className="text-gray-300 font-medium">
                Net Amount: {formatCurrency(netAmount)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Transaction Information</span>
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-400">Payment Provider</div>
                <div className="text-gray-200 font-medium">
                  {PROVIDER_NAMES[payment.provider || ''] || payment.provider || 'Unknown'}
                </div>
              </div>
            </div>

            {payment.provider_payment_id && (
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-400">Provider Payment ID</div>
                  <div className="text-gray-200 font-mono text-sm">
                    {payment.provider_payment_id}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-400">Payment Date</div>
                <div className="text-gray-200">
                  {formatDate(payment.paid_at || payment.created_at)}
                </div>
              </div>
            </div>

            {payment.refunded_at && (
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-400">Refunded Date</div>
                  <div className="text-orange-400">
                    {formatDate(payment.refunded_at)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-400">Currency</div>
                <div className="text-gray-200">{payment.currency}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Additional Details</h2>
          
          <div className="space-y-3">
            {invoice && (
              <div className="p-3 bg-dark-800 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Linked Invoice</div>
                <button
                  onClick={() => navigate(`/invoices/${payment.invoice_id}`)}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  {invoice.invoice_number}
                </button>
                <div className="text-sm text-gray-400 mt-1">
                  {invoice.customer?.name} • {formatCurrency(invoice.total_amount)}
                </div>
              </div>
            )}

            {payment.description && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Description</div>
                <div className="text-gray-200 bg-dark-800 p-3 rounded-lg">
                  {payment.description}
                </div>
              </div>
            )}

            {payment.failure_reason && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="text-sm text-red-400 mb-1 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failure Reason</span>
                </div>
                <div className="text-red-300 text-sm">
                  {payment.failure_reason}
                </div>
              </div>
            )}

            {payment.metadata && Object.keys(payment.metadata).length > 0 && (
              <div>
                <div className="text-sm text-gray-400 mb-2">Metadata</div>
                <div className="bg-dark-800 p-3 rounded-lg">
                  <pre className="text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(payment.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Payment Timeline</h2>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            </div>
            <div className="flex-1">
              <div className="text-gray-300 font-medium">Payment Created</div>
              <div className="text-sm text-gray-500">{formatDate(payment.created_at)}</div>
            </div>
          </div>

          {payment.paid_at && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center border border-green-500/30">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="text-gray-300 font-medium">Payment Processed</div>
                <div className="text-sm text-gray-500">{formatDate(payment.paid_at)}</div>
              </div>
            </div>
          )}

          {payment.refunded_at && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-900/30 flex items-center justify-center border border-orange-500/30">
                <DollarSign className="w-4 h-4 text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="text-gray-300 font-medium">Payment Refunded</div>
                <div className="text-sm text-gray-500">{formatDate(payment.refunded_at)}</div>
                <div className="text-sm text-orange-400 mt-1">
                  Amount: {formatCurrency(payment.refund_amount)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Information */}
      {payment.status === 'succeeded' && payment.refund_amount === 0 && (
        <div className="card bg-green-900/20 border-green-500/30">
          <div className="flex items-center space-x-3 text-green-400">
            <CheckCircle className="h-6 w-6" />
            <div>
              <p className="font-medium">Payment Successful</p>
              <p className="text-sm text-green-400/80">
                This payment was processed successfully
              </p>
            </div>
          </div>
        </div>
      )}

      {payment.status === 'failed' && (
        <div className="card bg-red-900/20 border-red-500/30">
          <div className="flex items-center space-x-3 text-red-400">
            <XCircle className="h-6 w-6" />
            <div>
              <p className="font-medium">Payment Failed</p>
              <p className="text-sm text-red-400/80">
                {payment.failure_reason || 'This payment could not be processed'}
              </p>
            </div>
          </div>
        </div>
      )}

      {payment.status === 'refunded' && (
        <div className="card bg-orange-900/20 border-orange-500/30">
          <div className="flex items-center space-x-3 text-orange-400">
            <DollarSign className="h-6 w-6" />
            <div>
              <p className="font-medium">Payment Refunded</p>
              <p className="text-sm text-orange-400/80">
                {formatCurrency(payment.refund_amount)} was refunded on {formatDate(payment.refunded_at || undefined)}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
