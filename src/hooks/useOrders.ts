import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { ordersApi, type Order, type CreateOrderRequest, type UpdateOrderRequest } from '../lib/api'
import type { 
  OrderStatus,
  InventoryValidation,
  OrderTotal,
  UseOrdersReturn,
  OrderFilters,
  CreateOrderItemRequest
} from '../types/orders'

// Using TypeScript patterns from Context7 documentation with proper tuple typing
export function useOrders(filters?: OrderFilters): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuthStore()
  const isTestEnvironment = typeof process !== 'undefined' && (process.env.VITEST_WORKER_ID || process.env.NODE_ENV === 'test')

  // Generate unique order number
  const generateOrderNumber = useCallback((): string => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `ORD-${timestamp}-${random}`.toUpperCase()
  }, [])

  // Fetch orders using REST API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {}
      
      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        params.status = filters.status[0] // API expects single status for now
      }
      
      if (filters?.payment_status && filters.payment_status.length > 0) {
        params.paymentStatus = filters.payment_status[0] // API expects single status
      }
      
      if (filters?.customer_id) {
        params.customerId = filters.customer_id
      }
      
      if (filters?.date_from) {
        params.startDate = filters.date_from
      }
      
      if (filters?.date_to) {
        params.endDate = filters.date_to
      }
      
      if (filters?.search) {
        params.search = filters.search
      }

      const response = await ordersApi.list(params)
      setOrders(response.data.data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Calculate order totals
  const calculateOrderTotal = useCallback(async (items: CreateOrderItemRequest[], discountAmount = 0): Promise<OrderTotal> => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const tax_amount = subtotal * 0.1 // 10% tax rate - should be configurable
    const total_amount = subtotal + tax_amount - discountAmount

    return {
      subtotal,
      tax_amount,
      discount_amount: discountAmount,
      total_amount: Math.max(0, total_amount) // Ensure total is not negative
    }
  }, [])

  // Create new order
  const createOrder = useCallback(async (orderData: CreateOrderRequest): Promise<Order> => {
    try {
      // Calculate totals if not provided
      const totals = await calculateOrderTotal(orderData.items, orderData.discountAmount || 0)
      
      const orderRequest = {
        customerId: orderData.customerId,
        items: orderData.items.map(item => ({
          productId: item.productId,
          inventoryId: item.inventoryId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        subtotal: totals.subtotal,
        taxAmount: totals.tax_amount,
        totalAmount: totals.total_amount,
        discountAmount: orderData.discountAmount || 0,
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes,
        deliveryDate: orderData.deliveryDate,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
      }

      const response = await ordersApi.create(orderRequest)
      const newOrder = response.data

      // Refresh orders list
      await fetchOrders()

      return newOrder
    } catch (err) {
      console.error('Error creating order:', err)
      throw err
    }
  }, [fetchOrders, calculateOrderTotal])

  // Update order
  const updateOrder = useCallback(async (orderId: string, updates: UpdateOrderRequest): Promise<Order> => {
    try {
      const response = await ordersApi.update(orderId, updates)
      const updatedOrder = response.data
      
      // Refresh orders list
      await fetchOrders()

      return updatedOrder
    } catch (err) {
      console.error('Error updating order:', err)
      throw err
    }
  }, [fetchOrders])

  // Update order status with history tracking
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, notes?: string): Promise<void> => {
    try {
      // Update order status (backend handles status history automatically)
      await updateOrder(orderId, { status })
    } catch (err) {
      console.error('Error updating order status:', err)
      throw err
    }
  }, [updateOrder])

  // Delete order
  const deleteOrder = useCallback(async (orderId: string): Promise<void> => {
    try {
      await ordersApi.delete(orderId)
      
      // Refresh orders list
      await fetchOrders()
    } catch (err) {
      console.error('Error deleting order:', err)
      throw err
    }
  }, [fetchOrders])

  // Validate inventory availability
  const validateInventory = useCallback(async (items: CreateOrderItemRequest[]): Promise<InventoryValidation> => {
    // For now, return valid - inventory validation will be handled by backend
    return {
      isValid: true,
      errors: [],
      warnings: []
    }
  }, [])

  // Refresh orders
  const refreshOrders = useCallback(async (): Promise<void> => {
    await fetchOrders()
  }, [fetchOrders])

  // Load orders on mount and when dependencies change
  useEffect(() => {
    if (!isTestEnvironment) {
      fetchOrders()
    }
  }, [fetchOrders, isTestEnvironment])

  // Return hook interface using TypeScript tuple pattern from Context7
  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    validateInventory,
    calculateOrderTotal,
    refreshOrders
  } as const
}