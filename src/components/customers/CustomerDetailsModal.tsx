import React, { useEffect, useState } from 'react'
import { X, User, Mail, Phone, MapPin, FileText, ShoppingBag, CreditCard } from 'lucide-react'
import { useCustomers } from '../../hooks/useCustomers'
import type { Customer } from '../../types/orders'

interface CustomerDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
}

export function CustomerDetailsModal({ isOpen, onClose, customer: initialCustomer }: CustomerDetailsModalProps) {
  const { refreshCustomers } = useCustomers()
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer)
  const [loading, setLoading] = useState(false)

  // Load full customer details when modal opens
  useEffect(() => {
    const loadCustomerDetails = async () => {
      if (isOpen && initialCustomer?.id) {
        setLoading(true)
        try {
          await refreshCustomers()
          setCustomer(initialCustomer)
        } catch (error) {
          console.error('Error loading customer details:', error)
          setCustomer(initialCustomer) // Fallback to initial customer
        } finally {
          setLoading(false)
        }
      }
    }

    loadCustomerDetails()
  }, [isOpen, initialCustomer?.id, refreshCustomers])

  if (!isOpen || !customer) return null

  const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-ZA')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
            <p className="text-sm text-gray-600">{customer.name}</p>
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
              <div className="text-lg">Loading customer details...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                    <h3 className="text-sm font-medium text-blue-900">Total Orders</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{customer.total_orders || 0}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <h3 className="text-sm font-medium text-green-900">Total Spent</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(customer.total_spent || 0)}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-5 w-5 text-purple-600" />
                    <h3 className="text-sm font-medium text-purple-900">Customer Since</h3>
                  </div>
                  <p className="text-lg font-semibold text-purple-600">{formatDate(customer.created_at)}</p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-lg">{customer.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      customer.customer_type === 'business' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {customer.customer_type === 'business' ? 'Business' : 'Individual'}
                    </span>
                  </div>
                  
                  {customer.tax_number && (
                    <div>
                      <p className="text-sm text-gray-600">Tax Number</p>
                      <p className="font-medium">{customer.tax_number}</p>
                    </div>
                  )}
                  
                  {customer.last_order_date && (
                    <div>
                      <p className="text-sm text-gray-600">Last Order</p>
                      <p className="font-medium">{formatDate(customer.last_order_date)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customer.email ? (
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`mailto:${customer.email}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {customer.email}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="text-gray-400">No email provided</p>
                    </div>
                  )}
                  
                  {customer.phone ? (
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`tel:${customer.phone}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {customer.phone}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="text-gray-400">No phone provided</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              {(customer.address || customer.city || customer.state) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {customer.address && (
                      <p className="font-medium">{typeof customer.address === 'string' ? customer.address : ''}</p>
                    )}
                    {(customer.city || customer.state || customer.postal_code) && (
                      <p className="text-gray-700">
                        {[customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {customer.country && (
                      <p className="text-gray-700">{customer.country}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {customer.notes && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}

              {/* Order History */}
              {customer.orders && customer.orders.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customer.orders.slice(0, 10).map((order: any) => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {order.order_number}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(order.order_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(order.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {customer.orders.length > 10 && (
                    <div className="px-6 py-3 bg-gray-50 text-center">
                      <p className="text-sm text-gray-600">
                        Showing 10 of {customer.orders.length} orders
                      </p>
                    </div>
                  )}
                </div>
              )}
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
