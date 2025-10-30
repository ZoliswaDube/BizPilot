import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  Send,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar
} from 'lucide-react'
import { useInvoices } from '../../hooks/useInvoices'
import { useCustomers } from '../../hooks/useCustomers'
import { useBusiness } from '../../hooks/useBusiness'
import { useCurrency } from '../../hooks/useCurrency'
import type { InvoiceStatus } from '../../types/payments'

// Status color mapping
const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-900/30 text-gray-400 border-gray-500/30',
  sent: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
  viewed: 'bg-purple-900/30 text-purple-400 border-purple-500/30',
  paid: 'bg-green-900/30 text-green-400 border-green-500/30',
  overdue: 'bg-red-900/30 text-red-400 border-red-500/30',
  cancelled: 'bg-gray-900/30 text-gray-400 border-gray-500/30',
  refunded: 'bg-orange-900/30 text-orange-400 border-orange-500/30'
}

const STATUS_ICONS: Record<InvoiceStatus, React.ComponentType<any>> = {
  draft: FileText,
  sent: Send,
  viewed: Eye,
  paid: CheckCircle,
  overdue: AlertCircle,
  cancelled: XCircle,
  refunded: DollarSign
}

export function InvoiceList() {
  const navigate = useNavigate()
  const { userRole, hasPermission } = useBusiness()
  const { format: formatCurrency } = useCurrency()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus[]>([])
  const [showFilters, setShowFilters] = useState(false)
  
  const { invoices, loading, error, deleteInvoice, sendInvoice, generateInvoicePDF } = useInvoices({
    status: statusFilter.length > 0 ? statusFilter : undefined
  })
  const { customers } = useCustomers()

  // Check permissions
  const canCreate = hasPermission('invoices', 'create') || userRole === 'admin' || userRole === 'manager'
  const canEdit = hasPermission('invoices', 'update') || userRole === 'admin' || userRole === 'manager'
  const canDelete = hasPermission('invoices', 'delete') || userRole === 'admin'

  // Filter invoices based on search term
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices

    const term = searchTerm.toLowerCase()
    return invoices.filter(invoice => 
      invoice.invoice_number.toLowerCase().includes(term) ||
      invoice.customer?.name?.toLowerCase().includes(term) ||
      invoice.notes?.toLowerCase().includes(term)
    )
  }, [invoices, searchTerm])

  const handleCreateInvoice = () => {
    navigate('/invoices/new')
  }

  const handleViewInvoice = (id: string) => {
    navigate(`/invoices/${id}`)
  }

  const handleEditInvoice = (id: string) => {
    navigate(`/invoices/edit/${id}`)
  }

  const handleDeleteInvoice = async (id: string, invoiceNumber: string) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      try {
        await deleteInvoice(id)
      } catch (err) {
        console.error('Failed to delete invoice:', err)
        alert('Failed to delete invoice. It may have already been sent or paid.')
      }
    }
  }

  const handleSendInvoice = async (id: string, invoiceNumber: string) => {
    if (window.confirm(`Send invoice ${invoiceNumber} to customer?`)) {
      try {
        await sendInvoice(id)
        alert('Invoice sent successfully!')
      } catch (err) {
        console.error('Failed to send invoice:', err)
        alert('Failed to send invoice. Please try again.')
      }
    }
  }

  const handleDownloadPDF = async (id: string, invoiceNumber: string) => {
    try {
      const pdfUrl = await generateInvoicePDF(id)
      if (pdfUrl) {
        window.open(pdfUrl, '_blank')
      } else {
        alert('Failed to generate PDF. Please try again.')
      }
    } catch (err) {
      console.error('Failed to download PDF:', err)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const toggleStatusFilter = (status: InvoiceStatus) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = (invoice: any) => {
    return invoice.status === 'overdue' || (
      ['sent', 'viewed'].includes(invoice.status) && 
      new Date(invoice.due_date) < new Date()
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading invoices...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-900/20 border-red-500/30">
        <div className="text-red-400">
          <h3 className="font-medium">Error loading invoices</h3>
          <p className="text-sm mt-1">{error}</p>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Invoices</h1>
          <p className="text-gray-400 mt-1">Manage and track your invoices</p>
        </div>
        {canCreate && (
          <motion.button
            onClick={handleCreateInvoice}
            className="btn-primary flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-5 w-5" />
            <span>Create Invoice</span>
          </motion.button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm">Filters</span>
              {statusFilter.length > 0 && (
                <span className="px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                  {statusFilter.length}
                </span>
              )}
            </button>

            {statusFilter.length > 0 && (
              <button
                onClick={() => setStatusFilter([])}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-dark-700">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'] as InvoiceStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => toggleStatusFilter(status)}
                        className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                          statusFilter.includes(status)
                            ? STATUS_COLORS[status]
                            : 'bg-dark-800 text-gray-400 border-dark-700 hover:border-dark-600'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300">No invoices found</h3>
            <p className="text-gray-400 mt-2">
              {searchTerm || statusFilter.length > 0
                ? 'Try adjusting your search or filters'
                : 'Create your first invoice to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-dark-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredInvoices.map((invoice) => {
                  const StatusIcon = STATUS_ICONS[invoice.status]
                  const overdueClass = isOverdue(invoice) ? 'bg-red-900/10' : ''
                  
                  return (
                    <motion.tr 
                      key={invoice.id}
                      className={`hover:bg-dark-800 transition-colors ${overdueClass}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="font-medium text-primary-400 hover:text-primary-300"
                        >
                          {invoice.invoice_number}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-300">
                          {invoice.customer?.name || 'No customer'}
                        </div>
                        {invoice.customer?.email && (
                          <div className="text-sm text-gray-500">{invoice.customer.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {formatDate(invoice.issue_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {isOverdue(invoice) && (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className={isOverdue(invoice) ? 'text-red-400' : 'text-gray-300'}>
                            {formatDate(invoice.due_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-300 font-medium">
                          {formatCurrency(invoice.total_amount)}
                        </div>
                        {invoice.amount_due > 0 && invoice.status !== 'draft' && (
                          <div className="text-sm text-gray-500">
                            Due: {formatCurrency(invoice.amount_due)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border ${STATUS_COLORS[invoice.status]}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="p-1 text-gray-400 hover:text-primary-400 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {canEdit && invoice.status === 'draft' && (
                            <button
                              onClick={() => handleEditInvoice(invoice.id)}
                              className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          
                          {invoice.status === 'draft' && (
                            <button
                              onClick={() => handleSendInvoice(invoice.id, invoice.invoice_number)}
                              className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                              title="Send"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                            className="p-1 text-gray-400 hover:text-purple-400 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          
                          {canDelete && invoice.status === 'draft' && (
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id, invoice.invoice_number)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredInvoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-gray-400">Total Invoices</div>
            <div className="text-2xl font-bold text-gray-100 mt-1">
              {filteredInvoices.length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400">Total Billed</div>
            <div className="text-2xl font-bold text-gray-100 mt-1">
              {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400">Total Paid</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.amount_paid, 0))}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400">Outstanding</div>
            <div className="text-2xl font-bold text-orange-400 mt-1">
              {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.amount_due, 0))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
