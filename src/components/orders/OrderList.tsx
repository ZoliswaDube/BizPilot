import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  DollarSign,
  User,
  Calendar,
  MoreHorizontal
} from 'lucide-react'
import { useOrdersSupabase } from '../../hooks/useOrdersSupabase'
import { useCurrency } from '../../hooks/useCurrency'
import { OrderListSkeleton } from '../ui/skeleton'
import type { Order, OrderStatus, PaymentStatus, OrderFilters } from '../../types/orders'

// Status color mapping
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
  processing: 'bg-purple-900/30 text-purple-400 border-purple-500/30',
  shipped: 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30',
  delivered: 'bg-green-900/30 text-green-400 border-green-500/30',
  cancelled: 'bg-red-900/30 text-red-400 border-red-500/30'
}

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: 'bg-red-900/30 text-red-400 border-red-500/30',
  partial: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  paid: 'bg-green-900/30 text-green-400 border-green-500/30',
  refunded: 'bg-gray-900/30 text-gray-400 border-gray-500/30'
}

const STATUS_ICONS: Record<OrderStatus, React.ComponentType<any>> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle
}

interface OrderListProps {
  onOrderSelect?: (order: Order) => void
  showActions?: boolean
  compact?: boolean
}

export function OrderList() {
  const navigate = useNavigate()
  const { format: formatCurrency } = useCurrency()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<OrderFilters>({
    status: [],
    payment_status: [],
    customer_id: undefined,
    date_from: undefined,
    date_to: undefined,
    search: undefined
  })

  const { orders, loading, error, timeoutError, deleteOrder, refreshOrders } = useOrdersSupabase(filters)
  
  // Define showActions - controls whether action buttons are shown
  const showActions = true // Always show actions for now

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders

    const term = searchTerm.toLowerCase()
    return orders.filter(order => 
      order.order_number.toLowerCase().includes(term) ||
      order.notes?.toLowerCase().includes(term)
    )
  }, [orders, searchTerm])

  const handleCreateOrder = () => {
    navigate('/orders/new')
  }

  const handleViewOrder = (order: Order) => {
    setViewingOrder(order)
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
  }

  const handleDeleteOrder = async (order: Order) => {
    if (window.confirm(`Are you sure you want to delete order ${order.order_number}?`)) {
      try {
        await deleteOrder(order.id)
      } catch (err) {
        console.error('Failed to delete order:', err)
        // TODO: Show error toast
      }
    }
  }
  
  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }
  
  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Show skeleton while loading
  if (loading && orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Orders</h1>
            <p className="text-gray-400">Manage your sales orders</p>
          </div>
        </div>
        <OrderListSkeleton items={5} />
      </motion.div>
    )
  }

  if (error || timeoutError) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card bg-red-900/20 border-red-500/30"
      >
        <div className="text-red-400 text-center py-8">
          <XCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">Unable to load orders</h3>
          <p className="text-sm mb-4">{error || 'Connection timeout. Please check your internet connection.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </motion.div>
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
          <h1 className="text-2xl font-bold text-gray-100">Orders</h1>
          <p className="text-gray-400">Manage customer orders and track fulfillment</p>
        </div>
        {showActions && (
          <motion.button
            onClick={handleCreateOrder}
            className="btn-primary flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            <span>New Order</span>
          </motion.button>
        )}
      </div>

      {/* Search and Filters */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by number, customer, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center space-x-2 ${showFilters ? 'bg-primary-600' : ''}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </motion.button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div 
            className="mt-4 pt-4 border-t border-dark-600 grid grid-cols-1 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status?.[0] || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  status: e.target.value ? [e.target.value as OrderStatus] : undefined 
                }))}
                className="input w-full"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Payment Status</label>
              <select
                value={filters.payment_status?.[0] || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  payment_status: e.target.value ? [e.target.value as PaymentStatus] : undefined 
                }))}
                className="input w-full"
              >
                <option value="">All Payment Statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date From</label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value || undefined }))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date To</label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value || undefined }))}
                className="input w-full"
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Orders Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: filteredOrders.length, icon: Package, color: 'blue' },
          { label: 'Pending', value: filteredOrders.filter(o => o.status === 'pending').length, icon: Clock, color: 'yellow' },
          { label: 'Processing', value: filteredOrders.filter(o => ['confirmed', 'processing'].includes(o.status)).length, icon: Package, color: 'purple' },
          { label: 'Completed', value: filteredOrders.filter(o => o.status === 'delivered').length, icon: CheckCircle, color: 'green' }
        ].map((stat, index) => (
          <motion.div 
            key={stat.label}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <div className="flex items-center">
              <div className={`p-2 bg-${stat.color}-900/30 rounded-lg border border-${stat.color}-500/30`}>
                <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                <p className="text-xl font-bold text-gray-100">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No orders found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || Object.keys(filters).length > 0 
                ? 'Try adjusting your search or filters'
                : 'Create your first order to get started'
              }
            </p>
            {showActions && !searchTerm && Object.keys(filters).length === 0 && (
              <button onClick={handleCreateOrder} className="btn-primary">
                Create First Order
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-dark-500 bg-dark-700 text-primary-600"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Order</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Payment</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Date</th>
                  {showActions && <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => {
                  const StatusIcon = STATUS_ICONS[order.status]
                  return (
                    <motion.tr
                      key={order.id}
                      className="border-b border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleViewOrder(order)}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded border-dark-500 bg-dark-700 text-primary-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-100">{order.order_number}</p>
                          {order.notes && (
                            <p className="text-sm text-gray-400 truncate max-w-xs">{order.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-gray-100">{order.customer_id ? `Customer ${order.customer_id}` : 'Walk-in Customer'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status]}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
                          <DollarSign className="h-3 w-3 mr-1" />
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-100">{formatCurrency(order.total_amount)}</p>
                        {order.discount_amount > 0 && (
                          <p className="text-sm text-green-400">-{formatCurrency(order.discount_amount)} discount</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-gray-300">
                          <Calendar className="h-4 w-4 mr-2" />
                          <div>
                            <p>{formatDate(order.order_date)}</p>
                            {order.estimated_delivery_date && (
                              <p className="text-sm text-gray-400">
                                Est: {formatDate(order.estimated_delivery_date)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      {showActions && (
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="p-1 text-gray-400 hover:text-primary-400 transition-colors"
                              title="View Order"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditOrder(order)}
                              className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                              title="Edit Order"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <motion.div 
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-dark-800 border border-dark-600 rounded-lg shadow-lg px-4 py-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">
              {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="btn-secondary text-sm">
                Update Status
              </button>
              <button className="btn-secondary text-sm text-red-400 hover:text-red-300">
                Delete Selected
              </button>
            </div>
            <button
              onClick={() => setSelectedOrders(new Set())}
              className="text-gray-400 hover:text-gray-300"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}