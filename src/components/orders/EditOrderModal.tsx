import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import type { Order, UpdateOrderRequest } from '../../types/orders'
const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

const PAYMENT_STATUS_LABELS: Record<Order['payment_status'], string> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
  refunded: 'Refunded'
}

interface EditOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  onSuccess: () => void
}

export function EditOrderModal({ isOpen, onClose, order, onSuccess }: EditOrderModalProps) {
  const { updateOrder } = useOrders()
  
  const [status, setStatus] = useState<Order['status']>('pending')
  const [paymentStatus, setPaymentStatus] = useState<Order['payment_status']>('unpaid')
  const [notes, setNotes] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form with order data
  useEffect(() => {
    if (order) {
      setStatus(order.status)
      setPaymentStatus(order.payment_status)
      setNotes(order.notes || '')
      setDeliveryDate(order.delivery_date ? order.delivery_date.split('T')[0] : '')
    }
  }, [order])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    setLoading(true)
    setError(null)

    try {
      const updates: UpdateOrderRequest = {
        status,
        payment_status: paymentStatus,
        notes: notes.trim() || undefined,
        estimated_delivery_date: deliveryDate || undefined
      }

      const success = await updateOrder(order.id, updates)
      if (success) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !order) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Order</h2>
            <p className="text-sm text-gray-600">Order #{order.order_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status *
              </label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as Order['status'])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Current: {ORDER_STATUS_LABELS[order.status]}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status *
              </label>
              <select
                required
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as Order['payment_status'])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Current: {PAYMENT_STATUS_LABELS[order.payment_status]}
              </p>
            </div>
          </div>

          {/* Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Date (Optional)
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {order.delivery_date && (
              <p className="mt-1 text-sm text-gray-500">
                Current: {new Date(order.delivery_date).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any updates or special instructions..."
            />
            {order.notes && (
              <p className="mt-1 text-sm text-gray-500">
                Current notes: "{order.notes}"
              </p>
            )}
          </div>

          {/* Order Summary (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 font-medium">
                  {order.customer?.name || 'Walk-in Customer'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Items:</span>
                <span className="ml-2 font-medium">
                  {order.order_items?.length || 0} item(s)
                </span>
              </div>
              <div>
                <span className="text-gray-600">Subtotal:</span>
                <span className="ml-2 font-medium">R{order.subtotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="ml-2 font-medium text-green-600">
                  R{order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Change Warnings */}
          {status !== order.status && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Status Change Notice</h4>
              {status === 'cancelled' && order.status !== 'cancelled' && (
                <p className="text-sm text-yellow-700">
                  ⚠️ Changing status to "Cancelled" will restore inventory quantities for items in this order.
                </p>
              )}
              {status === 'delivered' && order.payment_status === 'unpaid' && (
                <p className="text-sm text-yellow-700">
                  ⚠️ This order is marked as delivered but payment is still unpaid. Consider updating payment status.
                </p>
              )}
              {status === 'shipped' && !order.delivery_date && !deliveryDate && (
                <p className="text-sm text-yellow-700">
                  ⚠️ Consider adding a delivery date when marking an order as shipped.
                </p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
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
              {loading ? 'Updating...' : 'Update Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
