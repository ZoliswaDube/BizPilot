import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { useBusiness } from './useBusiness'
import type { 
  Order, 
  OrderItem, 
  OrderStatusHistory,
  CreateOrderRequest, 
  UpdateOrderRequest, 
  OrderStatus,
  InventoryValidation,
  OrderTotal,
  UseOrdersReturn,
  OrderFilters,
  OrderSearchResult,
  CreateOrderItemRequest
} from '../types/orders'

// Using TypeScript patterns from Context7 documentation with proper tuple typing
export function useOrders(filters?: OrderFilters): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuthStore()
  const { business } = useBusiness()
  const isTestEnvironment = typeof process !== 'undefined' && (process.env.VITEST_WORKER_ID || process.env.NODE_ENV === 'test')

  // Generate unique order number
  const generateOrderNumber = useCallback((): string => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `ORD-${timestamp}-${random}`.toUpperCase()
  }, [])

  // Fetch orders using MCP server
  const fetchOrders = useCallback(async () => {
    if (!business?.id) return

    try {
      setLoading(true)
      setError(null)

      // Build query with filters
      let query = `
        SELECT 
          o.*,
          c.name as customer_name,
          c.email as customer_email,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.business_id = $1
      `
      const params: any[] = [business.id]
      let paramIndex = 2

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query += ` AND o.status = ANY($${paramIndex})`
        params.push(filters.status)
        paramIndex++
      }

      if (filters?.payment_status && filters.payment_status.length > 0) {
        query += ` AND o.payment_status = ANY($${paramIndex})`
        params.push(filters.payment_status)
        paramIndex++
      }

      if (filters?.customer_id) {
        query += ` AND o.customer_id = $${paramIndex}`
        params.push(filters.customer_id)
        paramIndex++
      }

      if (filters?.date_from) {
        query += ` AND o.order_date >= $${paramIndex}`
        params.push(filters.date_from)
        paramIndex++
      }

      if (filters?.date_to) {
        query += ` AND o.order_date <= $${paramIndex}`
        params.push(filters.date_to)
        paramIndex++
      }

      if (filters?.search) {
        query += ` AND (o.order_number ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex} OR o.notes ILIKE $${paramIndex})`
        params.push(`%${filters.search}%`)
        paramIndex++
      }

      query += `
        GROUP BY o.id, c.name, c.email
        ORDER BY o.created_at DESC
        LIMIT 100
      `

      // Use MCP server for database operations
      const result = await (window as any).mcpClient?.execute_sql({
        query,
        params
      })

      if (result?.error) {
        throw new Error(result.error.message || 'Failed to fetch orders')
      }

      setOrders(result?.data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [business?.id, filters])

  // Create new order
  const createOrder = useCallback(async (orderData: CreateOrderRequest): Promise<Order> => {
    if (!business?.id || !user?.id) {
      throw new Error('Business and user context required')
    }

    try {
      // Validate inventory first
      const validation = await validateInventory(orderData.items)
      if (!validation.isValid) {
        throw new Error(`Inventory validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // Calculate totals
      const totals = await calculateOrderTotal(orderData.items, orderData.discount_amount)
      const orderNumber = generateOrderNumber()

      // Create order using MCP server
      const orderResult = await (window as any).mcpClient?.execute_sql({
        query: `
          INSERT INTO orders (
            business_id, customer_id, order_number, status, subtotal, 
            tax_amount, discount_amount, total_amount, payment_status,
            notes, shipping_address, billing_address, estimated_delivery_date,
            payment_method, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          ) RETURNING *
        `,
        params: [
          business.id,
          orderData.customer_id || null,
          orderNumber,
          'pending',
          totals.subtotal,
          totals.tax_amount,
          totals.discount_amount,
          totals.total_amount,
          'unpaid',
          orderData.notes || null,
          orderData.shipping_address ? JSON.stringify(orderData.shipping_address) : null,
          orderData.billing_address ? JSON.stringify(orderData.billing_address) : null,
          orderData.estimated_delivery_date || null,
          orderData.payment_method || null,
          user.id
        ]
      })

      if (orderResult?.error) {
        throw new Error(orderResult.error.message || 'Failed to create order')
      }

      if (!orderResult || !Array.isArray(orderResult.data) || orderResult.data.length === 0) {
        throw new Error('Failed to create order')
      }

      const newOrder = orderResult.data[0]

      // Create order items
      for (const item of orderData.items) {
        await (window as any).mcpClient?.execute_sql({
          query: `
            INSERT INTO order_items (
              order_id, product_id, inventory_id, product_name, 
              quantity, unit_price, total_price
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          params: [
            newOrder.id,
            item.product_id || null,
            item.inventory_id || null,
            item.product_name,
            item.quantity,
            item.unit_price,
            item.quantity * item.unit_price
          ]
        })

        // Update inventory if inventory_id is provided
        if (item.inventory_id) {
          await (window as any).mcpClient?.execute_sql({
            query: `
              UPDATE inventory 
              SET current_quantity = current_quantity - $1,
                  updated_at = NOW()
              WHERE id = $2 AND business_id = $3
            `,
            params: [item.quantity, item.inventory_id, business.id]
          })

          // Create inventory transaction
          await (window as any).mcpClient?.execute_sql({
            query: `
              INSERT INTO inventory_transactions (
                business_id, user_id, inventory_id, type, 
                quantity_change, new_quantity, notes
              ) VALUES (
                $1, $2, $3, 'sale', $4, 
                (SELECT current_quantity FROM inventory WHERE id = $3),
                $5
              )
            `,
            params: [
              business.id,
              user.id,
              item.inventory_id,
              -item.quantity,
              `Order ${orderNumber} - ${item.product_name}`
            ]
          })
        }
      }

      // Create initial status history
      await (window as any).mcpClient?.execute_sql({
        query: `
          INSERT INTO order_status_history (order_id, status, changed_by, notes)
          VALUES ($1, $2, $3, $4)
        `,
        params: [newOrder.id, 'pending', user.id, 'Order created']
      })

      // Refresh orders list
      await fetchOrders()

      return newOrder
    } catch (err) {
      console.error('Error creating order:', err)
      throw err
    }
  }, [business?.id, user?.id, generateOrderNumber, fetchOrders])

  // Update order
  const updateOrder = useCallback(async (orderId: string, updates: UpdateOrderRequest): Promise<Order> => {
    if (!business?.id) {
      throw new Error('Business context required')
    }

    try {
      const updateFields: string[] = []
      const params: any[] = []
      let paramIndex = 1

      // Build dynamic update query
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`)
          params.push(typeof value === 'object' ? JSON.stringify(value) : value)
          paramIndex++
        }
      })

      if (updateFields.length === 0) {
        throw new Error('No updates provided')
      }

      updateFields.push(`updated_at = NOW()`)
      params.push(orderId, business.id)

      const result = await (window as any).mcpClient?.execute_sql({
        query: `
          UPDATE orders 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex} AND business_id = $${paramIndex + 1}
          RETURNING *
        `,
        params
      })

      if (result?.error) {
        throw new Error(result.error.message || 'Failed to update order')
      }

      const updatedOrder = result.data[0]
      
      // Refresh orders list
      await fetchOrders()

      return updatedOrder
    } catch (err) {
      console.error('Error updating order:', err)
      throw err
    }
  }, [business?.id, fetchOrders])

  // Update order status with history tracking
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, notes?: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User context required')
    }

    try {
      // Update order status
      await updateOrder(orderId, { status })

      // Add status history entry
      await (window as any).mcpClient?.execute_sql({
        query: `
          INSERT INTO order_status_history (order_id, status, changed_by, notes)
          VALUES ($1, $2, $3, $4)
        `,
        params: [orderId, status, user.id, notes || `Status changed to ${status}`]
      })
    } catch (err) {
      console.error('Error updating order status:', err)
      throw err
    }
  }, [user?.id, updateOrder])

  // Delete order
  const deleteOrder = useCallback(async (orderId: string): Promise<void> => {
    if (!business?.id) {
      throw new Error('Business context required')
    }

    try {
      const result = await (window as any).mcpClient?.execute_sql({
        query: `
          DELETE FROM orders 
          WHERE id = $1 AND business_id = $2
        `,
        params: [orderId, business.id]
      })

      if (result?.error) {
        throw new Error(result.error.message || 'Failed to delete order')
      }

      // Refresh orders list
      await fetchOrders()
    } catch (err) {
      console.error('Error deleting order:', err)
      throw err
    }
  }, [business?.id, fetchOrders])

  // Validate inventory availability
  const validateInventory = useCallback(async (items: CreateOrderItemRequest[]): Promise<InventoryValidation> => {
    if (!business?.id) {
      return { isValid: false, errors: [{ product_name: 'Unknown', requested_quantity: 0, available_quantity: 0, message: 'Business context required' }], warnings: [] }
    }

    try {
      const validation: InventoryValidation = {
        isValid: true,
        errors: [],
        warnings: []
      }

      for (const item of items) {
        if (item.inventory_id) {
          const result = await (window as any).mcpClient?.execute_sql({
            query: `
              SELECT current_quantity, low_stock_alert, name
              FROM inventory 
              WHERE id = $1 AND business_id = $2
            `,
            params: [item.inventory_id, business.id]
          })

          if (result?.data?.[0]) {
            const inventory = result.data[0]
            
            if (inventory.current_quantity < item.quantity) {
              validation.isValid = false
              validation.errors.push({
                inventory_id: item.inventory_id,
                product_name: item.product_name,
                requested_quantity: item.quantity,
                available_quantity: inventory.current_quantity,
                message: `Insufficient stock for ${item.product_name}. Available: ${inventory.current_quantity}, Requested: ${item.quantity}`
              })
            } else if (inventory.current_quantity - item.quantity <= (inventory.low_stock_alert || 0)) {
              validation.warnings.push({
                inventory_id: item.inventory_id,
                product_name: item.product_name,
                message: `${item.product_name} will be low on stock after this order`
              })
            }
          }
        }
      }

      return validation
    } catch (err) {
      console.error('Error validating inventory:', err)
      return {
        isValid: false,
        errors: [{ product_name: 'Unknown', requested_quantity: 0, available_quantity: 0, message: 'Failed to validate inventory' }],
        warnings: []
      }
    }
  }, [business?.id])

  // Calculate order totals
  const calculateOrderTotal = useCallback(async (items: CreateOrderItemRequest[], discountAmount = 0): Promise<OrderTotal> => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax_amount = subtotal * 0.1 // 10% tax rate - should be configurable
    const total_amount = subtotal + tax_amount - discountAmount

    return {
      subtotal,
      tax_amount,
      discount_amount: discountAmount,
      total_amount: Math.max(0, total_amount) // Ensure total is not negative
    }
  }, [])

  // Refresh orders
  const refreshOrders = useCallback(async (): Promise<void> => {
    await fetchOrders()
  }, [fetchOrders])

  // Load orders on mount and when dependencies change
  useEffect(() => {
    if (business?.id && !isTestEnvironment) {
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