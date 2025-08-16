import { motion } from 'framer-motion'
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle,
  AlertTriangle
} from 'lucide-react'
import type { OrderStatus, OrderStatusHistory } from '../../types/orders'

// Status workflow configuration
const STATUS_WORKFLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: 'Pending',
    description: 'Order received and awaiting confirmation',
    color: 'yellow'
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    description: 'Order confirmed and ready for processing',
    color: 'blue'
  },
  processing: {
    icon: Package,
    label: 'Processing',
    description: 'Order is being prepared',
    color: 'purple'
  },
  shipped: {
    icon: Truck,
    label: 'Shipped',
    description: 'Order has been shipped',
    color: 'indigo'
  },
  delivered: {
    icon: CheckCircle,
    label: 'Delivered',
    description: 'Order has been delivered',
    color: 'green'
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    description: 'Order has been cancelled',
    color: 'red'
  }
}

interface OrderStatusTrackerProps {
  currentStatus: OrderStatus
  statusHistory?: OrderStatusHistory[]
  showLabels?: boolean
  compact?: boolean
  interactive?: boolean
  onStatusClick?: (status: OrderStatus) => void
}

export function OrderStatusTracker({ 
  currentStatus, 
  statusHistory = [], 
  showLabels = true, 
  compact = false,
  interactive = false,
  onStatusClick 
}: OrderStatusTrackerProps) {
  
  // Determine which statuses to show based on current status
  const getVisibleStatuses = (): OrderStatus[] => {
    if (currentStatus === 'cancelled') {
      // For cancelled orders, show the path up to cancellation
      const lastValidStatus = statusHistory
        .filter(h => h.status !== 'cancelled')
        .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())[0]
      
      if (lastValidStatus) {
        const lastIndex = STATUS_WORKFLOW.indexOf(lastValidStatus.status as OrderStatus)
        return [...STATUS_WORKFLOW.slice(0, lastIndex + 1), 'cancelled']
      }
      return ['pending', 'cancelled']
    }
    
    // For normal workflow, show all statuses up to delivered
    return STATUS_WORKFLOW
  }

  const visibleStatuses = getVisibleStatuses()
  const currentIndex = visibleStatuses.indexOf(currentStatus)

  // Get status history entry for a specific status
  const getStatusHistoryEntry = (status: OrderStatus) => {
    return statusHistory.find(h => h.status === status)
  }

  // Determine if a status is completed, current, or future
  const getStatusState = (status: OrderStatus, index: number) => {
    if (currentStatus === 'cancelled') {
      if (status === 'cancelled') return 'current'
      const historyEntry = getStatusHistoryEntry(status)
      return historyEntry ? 'completed' : 'skipped'
    }
    
    if (index < currentIndex) return 'completed'
    if (index === currentIndex) return 'current'
    return 'future'
  }

  // Get color classes based on status state
  const getStatusColors = (status: OrderStatus, state: 'completed' | 'current' | 'future' | 'skipped') => {
    const config = STATUS_CONFIG[status]
    
    switch (state) {
      case 'completed':
        return {
          bg: `bg-${config.color}-900/30`,
          text: `text-${config.color}-400`,
          border: `border-${config.color}-500/50`,
          line: `bg-${config.color}-500`
        }
      case 'current':
        return {
          bg: `bg-${config.color}-900/50`,
          text: `text-${config.color}-300`,
          border: `border-${config.color}-400`,
          line: `bg-${config.color}-500`
        }
      case 'skipped':
        return {
          bg: 'bg-red-900/20',
          text: 'text-red-500',
          border: 'border-red-500/30',
          line: 'bg-red-500/50'
        }
      default: // future
        return {
          bg: 'bg-gray-900/30',
          text: 'text-gray-500',
          border: 'border-gray-600/30',
          line: 'bg-gray-600/30'
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (compact) {
    // Compact horizontal layout
    return (
      <div className="flex items-center space-x-2">
        {visibleStatuses.map((status, index) => {
          const config = STATUS_CONFIG[status]
          const state = getStatusState(status, index)
          const colors = getStatusColors(status, state)
          const Icon = config.icon
          const historyEntry = getStatusHistoryEntry(status)
          
          return (
            <div key={status} className="flex items-center">
              <motion.div
                className={`
                  relative p-2 rounded-full border-2 transition-all duration-200
                  ${colors.bg} ${colors.border} ${colors.text}
                  ${interactive ? 'cursor-pointer hover:scale-110' : ''}
                `}
                onClick={() => interactive && onStatusClick?.(status)}
                whileHover={interactive ? { scale: 1.1 } : {}}
                whileTap={interactive ? { scale: 0.95 } : {}}
                title={`${config.label}${historyEntry ? ` - ${formatDate(historyEntry.changed_at)}` : ''}`}
              >
                <Icon className="h-4 w-4" />
                {state === 'current' && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-current"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
              
              {index < visibleStatuses.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${colors.line}`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Full layout with labels and descriptions
  return (
    <div className="space-y-6">
      {visibleStatuses.map((status, index) => {
        const config = STATUS_CONFIG[status]
        const state = getStatusState(status, index)
        const colors = getStatusColors(status, state)
        const Icon = config.icon
        const historyEntry = getStatusHistoryEntry(status)
        const isLast = index === visibleStatuses.length - 1
        
        return (
          <motion.div
            key={status}
            className="relative flex items-start"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Status Icon */}
            <motion.div
              className={`
                relative flex-shrink-0 p-3 rounded-full border-2 transition-all duration-200
                ${colors.bg} ${colors.border} ${colors.text}
                ${interactive ? 'cursor-pointer hover:scale-110' : ''}
              `}
              onClick={() => interactive && onStatusClick?.(status)}
              whileHover={interactive ? { scale: 1.05 } : {}}
              whileTap={interactive ? { scale: 0.95 } : {}}
            >
              <Icon className="h-5 w-5" />
              
              {/* Pulse animation for current status */}
              {state === 'current' && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-current opacity-75"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.75, 0, 0.75] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Connecting Line */}
            {!isLast && (
              <div className={`absolute left-6 top-12 w-0.5 h-16 ${colors.line}`} />
            )}

            {/* Status Content */}
            <div className="ml-4 flex-1 pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-medium ${colors.text}`}>
                    {config.label}
                  </h3>
                  {showLabels && (
                    <p className="text-sm text-gray-400 mt-1">
                      {config.description}
                    </p>
                  )}
                </div>
                
                {/* Timestamp */}
                {historyEntry && (
                  <div className="text-right">
                    <p className="text-sm text-gray-300">
                      {formatDate(historyEntry.changed_at)}
                    </p>
                    {historyEntry.changed_by && (
                      <p className="text-xs text-gray-500">
                        by {historyEntry.changed_by}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Status Notes */}
              {historyEntry?.notes && (
                <div className="mt-2 p-2 bg-dark-800 rounded border border-dark-600">
                  <p className="text-sm text-gray-300">{historyEntry.notes}</p>
                </div>
              )}
              
              {/* Status Indicators */}
              <div className="flex items-center mt-2 space-x-2">
                {state === 'completed' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-500/30">
                    Completed
                  </span>
                )}
                {state === 'current' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-500/30">
                    Current
                  </span>
                )}
                {state === 'skipped' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-500/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Skipped
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}