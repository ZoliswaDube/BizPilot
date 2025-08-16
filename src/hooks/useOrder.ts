import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { useBusiness } from './useBusiness'
import type { 
  Order, 
  OrderItem, 
  OrderStatusHistory,
  UpdateOrderRequest, 
  OrderStatus,
  UseOrderReturn,
  CreateOrderItemRequest
} from '../types/orders'

// Hook for managing a single order with TypeScript patterns from Context7
export function useOrder(orderId: string): UseOrderReturn {
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuthStore()
  const { business } = useBusiness()

  // Fetch order details using MCP server
  const fetchOrder = useCallback(async () => {
    if (!business?.id || !orderId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch order with customer info
      const orderResult = await (window as any).mcpClient?.execute_sql({
        query: `
          SELECT 
            o.*,
            c.name as customer_name,
            c.email as customer_email,
            c.phone as customer_phone,
            c.company as customer_company
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          WHERE o.id = $1 AND o.business_id = $2
        `,
        params: [orderId, business.id]
      })

      if (orderResult?.error) {
        throw new Error(orderResult.error.message || 'Failed to fetch order')
      }

      if (!orderResult?.data?.[0]) {
        throw new Error('Order not found')
      }

      setOrder(orderResult.data[0])

      // Fetch order items
      const itemsResult = await (window as any).mcpClient?.execute_sql({
        query: `
          SELECT 
            oi.*,
            p.name as product_name_from_product,
            p.sku,
            i.name as inventory_name
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          LEFT JOIN inventory i ON oi.inventory_id = i.id
          WHERE oi.order_id = $1
          ORDER BY oi.created_at ASC
        `,
        params: [orderId]
      })

      if (itemsResult?.error) {
        throw new Error(itemsResult.error.message || 'Failed to fetch order items')
      }

      setOrderItems(itemsResult?.data || [])

      // Fetch status history
      const historyResult = await (window as any).mcpClient?.execute_sql({
        query: `
          SELECT 
            osh.*,
            up.full_name as changed_by_name,
            up.email as changed_by_email
          FROM order_status_history osh
          LEFT JOIN user_profiles up ON osh.changed_by = up.user_id
          WHERE osh.order_id = $1
          ORDER BY osh.changed_at DESC
        `,
        params: [orderId]
      })

      if (historyResult?.error) {
        console.warn('Failed to fetch status history:', historyResult.error)
        setStatusHistory([])
      } else {
        setStatusHistory(historyResult?.data || [])
      }

    } catch (err) {
      console.error('Error fetching order:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch order')
    } finally {
      setLoading(false)
    }
  }, [business?.id, orderId])

  // Update order
  const updateOrder = useCallback(async (updates: UpdateOrderRequest): Promise<Order> => {
    if (!business?.id || !order) {
      throw new Error('Business context and order required')
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
      setOrder(updatedOrder)
      
      return updatedOrder
    } catch (err) {
      console.error('Error updating order:', err)
      throw err
    }
  }, [business?.id, order, orderId])

  // Update order status with history tracking
  const updateStatus = useCallback(async (status: OrderStatus, notes?: string): Promise<void> => {
    if (!user?.id || !order) {
      throw new Error('User context and order required')
    }

    try {
      // Update order status
      await updateOrder({ status })

      // Add status history entry
      await (window as any).mcpClient?.execute_sql({
        query: `
          INSERT INTO order_status_history (order_id, status, changed_by, notes)
          VALUES ($1, $2, $3, $4)
        `,
        params: [orderId, status, user.id, notes || `Status changed to ${status}`]
      })

      // Refresh order data to get updated status history
      await fetchOrder()
    } catch (err) {
      console.error('Error updating order status:', err)
      throw err
    }
  }, [user?.id, order, orderId, updateOrder, fetchOrder])

  // Add item to order
  const addItem = useCallback(async (item: CreateOrderItemRequest): Promise<void> => {
    if (!business?.id || !order) {
      throw new Error('Business context and order required')
    }

    try {
      // Add order item
      const result = await (window as any).mcpClient?.execute_sql({
        query: `
          INSERT INTO order_items (
            order_id, product_id, inventory_id, product_name, 
            quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `,
        params: [
          orderId,
          item.product_id || null,
          item.inventory_id || null,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price
        ]
      })

      if (result?.error) {
        throw new Error(result.error.message || 'Failed to add item')
      }

      // Update order totals
      const newSubtotal = order.subtotal + (item.quantity * item.unit_price)
      const newTaxAmount = newSubtotal * 0.1 // 10% tax rate
      const newTotal = newSubtotal + newTaxAmount - order.discount_amount

      await updateOrder({
        // subtotal is derived server-side; do not send in updates
        tax_amount: newTaxAmount,
        total_amount: newTotal
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
            user?.id,
            item.inventory_id,
            -item.quantity,
            `Order ${order.order_number} - ${item.product_name} (item added)`
          ]
        })
      }

      // Refresh order data
      await fetchOrder()
    } catch (err) {
      console.error('Error adding item to order:', err)
      throw err
    }
  }, [business?.id, order, orderId, updateOrder, fetchOrder, user?.id])

  // Remove item from order
  const removeItem = useCallback(async (itemId: string): Promise<void> => {
    if (!business?.id || !order) {
      throw new Error('Business context and order required')
    }

    try {
      // Get item details before deletion for inventory restoration
      const itemResult = await (window as any).mcpClient?.execute_sql({
        query: `SELECT * FROM order_items WHERE id = $1 AND order_id = $2`,
        params: [itemId, orderId]
      })

      if (!itemResult?.data?.[0]) {
        throw new Error('Order item not found')
      }

      const item = itemResult.data[0]

      // Delete order item
      const deleteResult = await (window as any).mcpClient?.execute_sql({
        query: `DELETE FROM order_items WHERE id = $1 AND order_id = $2`,
        params: [itemId, orderId]
      })

      if (deleteResult?.error) {
        throw new Error(deleteResult.error.message || 'Failed to remove item')
      }

      // Update order totals
      const newSubtotal = order.subtotal - item.total_price
      const newTaxAmount = newSubtotal * 0.1 // 10% tax rate
      const newTotal = newSubtotal + newTaxAmount - order.discount_amount

      await updateOrder({
        tax_amount: Math.max(0, newTaxAmount),
        total_amount: Math.max(0, newTotal)
      })

      // Restore inventory if inventory_id exists
      if (item.inventory_id) {
        await (window as any).mcpClient?.execute_sql({
          query: `
            UPDATE inventory 
            SET current_quantity = current_quantity + $1,
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
              $1, $2, $3, 'adjustment', $4, 
              (SELECT current_quantity FROM inventory WHERE id = $3),
              $5
            )
          `,
          params: [
            business.id,
            user?.id,
            item.inventory_id,
            item.quantity,
            `Order ${order.order_number} - ${item.product_name} (item removed)`
          ]
        })
      }

      // Refresh order data
      await fetchOrder()
    } catch (err) {
      console.error('Error removing item from order:', err)
      throw err
    }
  }, [business?.id, order, orderId, updateOrder, fetchOrder, user?.id])

  // Refresh order data
  const refreshOrder = useCallback(async (): Promise<void> => {
    await fetchOrder()
  }, [fetchOrder])

  // Load order on mount and when orderId changes
  useEffect(() => {
    if (business?.id && orderId) {
      fetchOrder()
    }
  }, [fetchOrder])

  // Return hook interface using TypeScript tuple pattern from Context7
  return {
    order,
    orderItems,
    statusHistory,
    loading,
    error,
    updateOrder,
    updateStatus,
    addItem,
    removeItem,
    refreshOrder
  } as const
}