import React, { useEffect, useState } from 'react'
import { X, Package, User, Calendar, CreditCard, FileText, Truck } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { useCurrency } from '../../hooks/useCurrency'
import type { Order } from '../../types/orders'
const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
} as const
const PAYMENT_STATUS_LABELS = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
  refunded: 'Refunded'
} as const
const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 border-yellow-600',
  confirmed: 'text-blue-400 border-blue-600',
  processing: 'text-cyan-400 border-cyan-600',
  shipped: 'text-purple-400 border-purple-600',
  delivered: 'text-green-400 border-green-600',
  cancelled: 'text-red-400 border-red-600'
}
const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: 'text-red-400 border-red-600',
  partial: 'text-yellow-400 border-yellow-600',
  paid: 'text-green-400 border-green-600',
  refunded: 'text-purple-400 border-purple-600'
}

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

export function OrderDetailsModal({ isOpen, onClose, order: initialOrder }: OrderDetailsModalProps) {
  const { getOrderById } = useOrders()
  const { format: formatCurrency, formatDate } = useCurrency()
  const [order, setOrder] = useState<Order | null>(initialOrder)
  const [loading, setLoading] = useState(false)

  // Load full order details when modal opens
  useEffect(() => {
    const loadOrderDetails = async () => {
      if (isOpen && initialOrder?.id) {
        setLoading(true)
        try {
          setOrder(initialOrder)
        } catch (error) {
          console.error('Error loading order details:', error)
          setOrder(initialOrder) // Fallback to initial order
        } finally {
          setLoading(false)
        }
      }
    }

    loadOrderDetails()
  }, [isOpen, initialOrder?.id, getOrderById])

  if (!isOpen || !order) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600">Order #{order.order_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-lg">Loading order details...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Status and Payment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-900">Order Status</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Status: </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Payment: </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
                        {PAYMENT_STATUS_LABELS[order.payment_status]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-900">Order Total</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">VAT (15%):</span>
                      <span className="text-sm font-medium">{formatCurrency(order.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-base font-semibold">Total:</span>
                      <span className="text-base font-semibold text-green-600">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
                </div>
                {order.customer ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{order.customer.name}</p>
                    </div>
                    {order.customer.email && (
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{order.customer.email}</p>
                      </div>
                    )}
                    {order.customer.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{order.customer.phone}</p>
                      </div>
                    )}
                    {order.customer.address && (
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">{typeof order.customer.address === 'string' ? order.customer.address : ''}</p>
                        {(order.customer as any).city && (order.customer as any).state && (
                          <p className="text-sm text-gray-600">
                            {(order.customer as any).city}, {(order.customer as any).state} {(order.customer as any).postal_code}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">Walk-in customer</p>
                )}
              </div>

              {/* Order Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">Important Dates</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-medium">{formatDate(order.order_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                  {order.delivery_date && (
                    <div>
                      <p className="text-sm text-gray-600">Delivery Date</p>
                      <p className="font-medium">{formatDate(order.delivery_date)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.order_items?.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.product_name}
                              </div>
                              {(item as any).product?.description && (
                                <div className="text-sm text-gray-500">
                                  {(item as any).product.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                  </div>
                  <p className="text-gray-700">{order.notes}</p>
                </div>
              )}

              {/* Order Timeline/History */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">Order History</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Created:</span>
                    <span className="font-medium">{formatDate(order.created_at)}</span>
                  </div>
                  {order.updated_at !== order.created_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">{formatDate(order.updated_at)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
