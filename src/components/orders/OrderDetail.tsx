import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  Package, 
  MapPin, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  Phone,
  Mail,
  Building,
  FileText,
  MoreHorizontal,
  Download,
  Printer,
  Send,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { useOrder } from '../../hooks/useOrder'
import { useOrders } from '../../hooks/useOrders'
import type { OrderStatus } from '../../types/orders'
import { formatCurrency } from '../../utils/calculations'

// Status configurations
const STATUS_COLORS = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
  processing: 'bg-purple-900/30 text-purple-400 border-purple-500/30',
  shipped: 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30',
  delivered: 'bg-green-900/30 text-green-400 border-green-500/30',
  cancelled: 'bg-red-900/30 text-red-400 border-red-500/30'
}

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle
}

const PAYMENT_STATUS_COLORS = {
  unpaid: 'bg-red-900/30 text-red-400 border-red-500/30',
  partial: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  paid: 'bg-green-900/30 text-green-400 border-green-500/30',
  refunded: 'bg-gray-900/30 text-gray-400 border-gray-500/30'
}

const STATUS_WORKFLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
}

interface OrderDetailProps {
  orderId?: string
  onClose?: () => void
}

export function OrderDetail({ orderId, onClose }: OrderDetailProps) {
  const navigate = useNavigate()
  const params = useParams()
  const currentOrderId = orderId || params.id
  
  const { order, orderItems, statusHistory, loading, error, updateStatus, refreshOrder } = useOrder(currentOrderId || '')
  const { deleteOrder } = useOrders()
  
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending')
  const [statusNotes, setStatusNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  if (!currentOrderId) {
    return (
      <div className="card bg-red-900/20 border-red-500/30">
        <div className="text-red-400">
          <h3 className="font-medium">Order not found</h3>
          <p className="text-sm mt-1">No order ID provided</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="card bg-red-900/20 border-red-500/30">
        <div className="text-red-400">
          <h3 className="font-medium">Error loading order</h3>
          <p className="text-sm mt-1">{error || 'Order not found'}</p>
        </div>
      </div>
    )
  }

  const StatusIcon = STATUS_ICONS[order.status]
  const availableStatuses = STATUS_WORKFLOW[order.status] || []

  const handleBack = () => {
    if (onClose) {
      onClose()
    } else {
      navigate('/orders')
    }
  }

  const handleEdit = () => {
    navigate(`/orders/edit/${order.id}`)
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete order ${order.order_number}?`)) {
      try {
        await deleteOrder(order.id)
        handleBack()
      } catch (err) {
        console.error('Failed to delete order:', err)
        // TODO: Show error toast
      }
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === order.status) return

    setUpdating(true)
    try {
      await updateStatus(selectedStatus, statusNotes || undefined)
      setShowStatusUpdate(false)
      setStatusNotes('')
    } catch (err) {
      console.error('Failed to update status:', err)
      // TODO: Show error toast
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
            onClick={handleBack}
            className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Order {order.order_number}</h1>
            <p className="text-gray-400">
              Created on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refreshOrder()}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleEdit}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <div className="relative">
            <button className="btn-secondary">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {/* TODO: Add dropdown menu */}
          </div>
        </div>
      </div>

      {/* Status and Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-100">Order Status</h3>
            {availableStatuses.length > 0 && (
              <button
                onClick={() => setShowStatusUpdate(true)}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                Update
              </button>
            )}
          </div>
          <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${STATUS_COLORS[order.status]}`}>
            <StatusIcon className="h-4 w-4 mr-2" />
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-100 mb-4">Payment Status</h3>
          <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
            <DollarSign className="h-4 w-4 mr-2" />
            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
          </div>
          {order.payment_method && (
            <p className="text-sm text-gray-400 mt-2">
              Method: {order.payment_method.replace('_', ' ').toUpperCase()}
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-100 mb-4">Order Total</h3>
          <p className="text-2xl font-bold text-gray-100">{formatCurrency(order.total_amount)}</p>
          {order.discount_amount > 0 && (
            <p className="text-sm text-green-400">
              {formatCurrency(order.discount_amount)} discount applied
            </p>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-dark-900 border border-dark-600 rounded-lg p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Update Order Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="input w-full"
                >
                  <option value={order.status}>Current: {order.status}</option>
                  {availableStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add notes about this status change..."
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStatusUpdate(false)}
                className="btn-secondary"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || selectedStatus === order.status}
                className="btn-primary disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Customer Information */}
      {order.customer_id && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-100">Customer ID: {order.customer_id}</span>
                </div>
              </div>
            </div>
            
            {/* Shipping Address */}
            {order.shipping_address && (
              <div>
                <h4 className="font-medium text-gray-100 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Shipping Address
                </h4>
                <div className="text-gray-300 text-sm space-y-1">
                  {order.shipping_address && (order.shipping_address as any).street && (
                    <p>{(order.shipping_address as any).street}</p>
                  )}
                  <p>
                    {order.shipping_address && [
                      (order.shipping_address as any).city,
                      (order.shipping_address as any).state,
                      (order.shipping_address as any).postal_code
                    ].filter(Boolean).join(', ')}
                  </p>
                  {order.shipping_address && (order.shipping_address as any).country && (
                    <p>{(order.shipping_address as any).country}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Order Items ({orderItems.length})
        </h3>
        
        {orderItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items found for this order</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orderItems.map((item, index) => (
              <div key={item.id} className="p-4 bg-dark-800 rounded-lg border border-dark-600">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-100">{item.product_name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                      <span>Qty: {item.quantity}</span>
                      <span>Unit Price: {formatCurrency(item.unit_price)}</span>
                      {item.sku && <span>SKU: {item.sku}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-100">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Summary */}
        <div className="border-t border-dark-600 mt-6 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Tax:</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount:</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold text-gray-100 border-t border-dark-600 pt-2">
              <span>Total:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      {statusHistory.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Order Timeline
          </h3>
          
          <div className="space-y-4">
            {statusHistory.map((entry, index) => {
              const EntryIcon = STATUS_ICONS[entry.status as OrderStatus] || Clock
              return (
                <div key={entry.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${STATUS_COLORS[entry.status as OrderStatus] || 'bg-gray-900/30 text-gray-400 border-gray-500/30'}`}>
                    <EntryIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-100">
                        Status changed to {entry.status}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatDate(entry.changed_at)}
                      </p>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-400 mt-1">{entry.notes}</p>
                    )}
                    {entry.changed_by_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        by {entry.changed_by_name}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Order Notes */}
      {order.notes && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Order Notes
          </h3>
          <p className="text-gray-300 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* Delivery Information */}
      {(order.estimated_delivery_date || order.actual_delivery_date) && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Delivery Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.estimated_delivery_date && (
              <div>
                <p className="text-sm text-gray-400">Estimated Delivery</p>
                <p className="font-medium text-gray-100">
                  {formatDateShort(order.estimated_delivery_date)}
                </p>
              </div>
            )}
            {order.actual_delivery_date && (
              <div>
                <p className="text-sm text-gray-400">Actual Delivery</p>
                <p className="font-medium text-gray-100">
                  {formatDateShort(order.actual_delivery_date)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Printer className="h-4 w-4" />
            <span>Print Order</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Email Customer</span>
          </button>
          <button 
            onClick={handleDelete}
            className="btn-secondary text-red-400 hover:text-red-300 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Order</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}