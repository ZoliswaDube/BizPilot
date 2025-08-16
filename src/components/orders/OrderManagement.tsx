import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Eye, Edit2, Trash2, Package, CreditCard } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { useCustomers } from '../../hooks/useCustomers'
import type { Order, OrderFilters } from '../../types/orders'
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
const ORDER_STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'text-yellow-400 border-yellow-600',
  confirmed: 'text-blue-400 border-blue-600',
  processing: 'text-cyan-400 border-cyan-600',
  shipped: 'text-purple-400 border-purple-600',
  delivered: 'text-green-400 border-green-600',
  cancelled: 'text-red-400 border-red-600'
}
const PAYMENT_STATUS_COLORS: Record<Order['payment_status'], string> = {
  unpaid: 'text-red-400 border-red-600',
  partial: 'text-yellow-400 border-yellow-600',
  paid: 'text-green-400 border-green-600',
  refunded: 'text-purple-400 border-purple-600'
}
import { CreateOrderModal } from './CreateOrderModal'
import { OrderDetailsModal } from './OrderDetailsModal'
import { EditOrderModal } from './EditOrderModal'

export function OrderManagement() {
  const { orders, loading, error, updateOrder, deleteOrder } = useOrders()
  const { customers } = useCustomers()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Order['status'][]>([])
  const [paymentFilter, setPaymentFilter] = useState<Order['payment_status'][]>([])
  const [customerFilter, setCustomerFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [orderStats, setOrderStats] = useState<any>(null)

  // Load order statistics
  useEffect(() => {
    setOrderStats(null)
  }, [orders])

  // Apply filters
  useEffect(() => {
    // Filtering is handled client-side for now
  }, [statusFilter, paymentFilter, customerFilter, searchTerm])

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    await updateOrder(orderId, { status })
  }

  const handlePaymentStatusChange = async (orderId: string, payment_status: Order['payment_status']) => {
    await updateOrder(orderId, { payment_status })
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowEditModal(true)
  }

  const handleCancelOrder = async (_orderId: string) => {}

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      await deleteOrder(orderId)
    }
  }

  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = !searchTerm || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(order.status)
    const matchesPayment = paymentFilter.length === 0 || paymentFilter.includes(order.payment_status)
    const matchesCustomer = !customerFilter || order.customer_id === customerFilter
    
    return matchesSearch && matchesStatus && matchesPayment && matchesCustomer
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-lg">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage sales orders and track revenue</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Order
        </button>
      </div>

      {/* Order Stats */}
      {orderStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.total_orders || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-600">{orderStats.pending_orders || 0}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">R{(orderStats.total_revenue || 0).toFixed(2)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-600">R{(orderStats.average_order_value || 0).toFixed(2)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                multiple
                value={statusFilter}
                onChange={(e) => setStatusFilter(Array.from(e.target.selectedOptions, option => option.value as Order['status']))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                multiple
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(Array.from(e.target.selectedOptions, option => option.value as Order['payment_status']))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All customers</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                      <div className="text-sm text-gray-500">{order.order_items?.length || 0} items</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.customer?.name || 'Walk-in Customer'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className={`text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${ORDER_STATUS_COLORS[order.status]}`}
                    >
                      {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.payment_status}
                      onChange={(e) => handlePaymentStatusChange(order.id, e.target.value as Order['payment_status'])}
                      className={`text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${PAYMENT_STATUS_COLORS[order.payment_status]}`}
                    >
                      {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R{order.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.order_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Order"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Cancel Order"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {orders.length === 0 ? 'Get started by creating your first order.' : 'No orders match your current filters.'}
            </p>
            {orders.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateOrderModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          // refresh handled by hook subscribers
        }}
      />
      
      <OrderDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        order={selectedOrder}
      />
      
      <EditOrderModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        order={selectedOrder}
        onSuccess={() => {
          setShowEditModal(false)
          // refresh handled by hook subscribers
        }}
      />
    </div>
  )
}
