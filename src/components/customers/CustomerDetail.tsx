import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Building2, 
  MapPin,
  Calendar,
  DollarSign,
  ShoppingCart,
  FileText,
  Loader2,
  Tag
} from 'lucide-react'
import { useBusiness } from '../../hooks/useBusiness'
import { useCurrency } from '../../hooks/useCurrency'
import { supabase } from '../../lib/supabase'
import type { Customer } from '../../types/orders'

export function CustomerDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { business, userRole, hasPermission } = useBusiness()
  const { format: formatCurrency } = useCurrency()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canEdit = hasPermission('customers', 'update') || userRole === 'admin' || userRole === 'manager'

  useEffect(() => {
    if (id && business?.id) {
      loadCustomerData(id)
    }
  }, [id, business?.id])

  const loadCustomerData = async (customerId: string) => {
    try {
      setLoading(true)
      setError('')

      // Load customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('business_id', business?.id)
        .single()

      if (customerError) throw customerError
      if (!customerData) throw new Error('Customer not found')

      // Load orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .eq('business_id', business?.id)
        .order('order_date', { ascending: false })
        .limit(10)

      // Load invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customerId)
        .eq('business_id', business?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setCustomer(customerData)
      setOrders(ordersData || [])
      setInvoices(invoicesData || [])
    } catch (err) {
      console.error('Error loading customer:', err)
      setError(err instanceof Error ? err.message : 'Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatAddress = (address: any) => {
    if (!address) return 'N/A'
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address)
      } catch {
        return address
      }
    }
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean)
    
    return parts.length > 0 ? parts.join(', ') : 'N/A'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-400">Loading customer...</p>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="card bg-red-900/20 border-red-500/30">
        <div className="text-red-400">
          <h3 className="font-medium">Error loading customer</h3>
          <p className="text-sm mt-1">{error || 'Customer not found'}</p>
          <button
            onClick={() => navigate('/customers')}
            className="mt-4 btn-secondary"
          >
            Back to Customers
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 text-gray-400 hover:text-gray-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{customer.name}</h1>
            {customer.company && (
              <p className="text-gray-400 mt-1 flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>{customer.company}</span>
              </p>
            )}
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => navigate(`/customers/edit/${customer.id}`)}
            className="btn-primary flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Customer</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center space-x-2 text-gray-400 mb-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm">Total Orders</span>
          </div>
          <div className="text-2xl font-bold text-gray-100">
            {customer.total_orders || 0}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 text-gray-400 mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Total Spent</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(customer.total_spent || 0)}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 text-gray-400 mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Avg Order Value</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {formatCurrency(customer.average_order_value || 0)}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 text-gray-400 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Last Order</span>
          </div>
          <div className="text-sm font-medium text-gray-200">
            {formatDate(customer.last_order_date)}
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Contact Information</h2>
          
          <div className="space-y-3">
            {customer.email && (
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-400">Email</div>
                  <a 
                    href={`mailto:${customer.email}`}
                    className="text-gray-200 hover:text-primary-400"
                  >
                    {customer.email}
                  </a>
                </div>
              </div>
            )}

            {customer.phone && (
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-400">Phone</div>
                  <a 
                    href={`tel:${customer.phone}`}
                    className="text-gray-200 hover:text-primary-400"
                  >
                    {customer.phone}
                  </a>
                </div>
              </div>
            )}

            {customer.address && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-400">Address</div>
                  <div className="text-gray-200">{formatAddress(customer.address)}</div>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-sm text-gray-400">Customer Since</div>
                <div className="text-gray-200">{formatDate(customer.created_at)}</div>
              </div>
            </div>

            {customer.preferred_contact_method && (
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-400">Preferred Contact</div>
                  <div className="text-gray-200 capitalize">{customer.preferred_contact_method}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Additional Information</h2>
          
          <div className="space-y-3">
            {customer.notes && (
              <div>
                <div className="text-sm text-gray-400 mb-1 flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Notes</span>
                </div>
                <div className="text-gray-200 bg-dark-800 p-3 rounded-lg">
                  {customer.notes}
                </div>
              </div>
            )}

            {customer.tags && customer.tags.length > 0 && (
              <div>
                <div className="text-sm text-gray-400 mb-2 flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span>Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customer.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-primary-900/30 text-primary-400 border border-primary-500/30 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Recent Orders</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              View All Orders
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-dark-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Order #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {orders.map((order) => (
                  <tr 
                    key={order.id}
                    className="hover:bg-dark-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <td className="px-4 py-3 text-primary-400 hover:text-primary-300">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatDate(order.order_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-300">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 font-medium">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Recent Invoices</h2>
            <button
              onClick={() => navigate('/invoices')}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              View All Invoices
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-dark-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {invoices.map((invoice) => (
                  <tr 
                    key={invoice.id}
                    className="hover:bg-dark-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <td className="px-4 py-3 text-primary-400 hover:text-primary-300">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-300">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 font-medium">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}
