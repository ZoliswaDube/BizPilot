/**
 * Supabase-based Orders Hook
 * Direct integration with Supabase for orders management
 * Includes caching and proper error handling
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useBusinessStore } from '../store/business'
import { useAuthStore } from '../store/auth'
import type { Order, OrderStatus, PaymentStatus, CreateOrderItemRequest } from '../types/orders'

interface OrderFilters {
  status?: OrderStatus[]
  payment_status?: PaymentStatus[]
  customer_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

interface OrderTotal {
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
}

export function useOrdersSupabase(filters?: OrderFilters) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeoutError, setTimeoutError] = useState(false)
  
  const { user } = useAuthStore()
  const { business } = useBusinessStore()

  // Generate unique order number
  const generateOrderNumber = useCallback((): string => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `ORD-${timestamp}-${random}`.toUpperCase()
  }, [])

  // Fetch orders from Supabase
  const fetchOrders = useCallback(async () => {
    if (!business) {
      setOrders([])
      return
    }

    setLoading(true)
    setError(null)
    setTimeoutError(false)
    
    // Set a 15-second timeout
    const timeoutId = setTimeout(() => {
      setTimeoutError(true)
      setLoading(false)
      setError('Loading is taking longer than expected. Please check your connection.')
    }, 15000)

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customer:customers(id, name, email, phone),
          items:order_items(*)
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
      
      if (filters?.payment_status && filters.payment_status.length > 0) {
        query = query.in('payment_status', filters.payment_status)
      }
      
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
      }
      
      if (filters?.date_from) {
        query = query.gte('order_date', filters.date_from)
      }
      
      if (filters?.date_to) {
        query = query.lte('order_date', filters.date_to)
      }
      
      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
      }

      const { data, error: fetchError } = await query

      clearTimeout(timeoutId)

      if (fetchError) {
        console.error('Error fetching orders:', fetchError)
        setError('Failed to load orders. Please try again.')
        setOrders([])
      } else {
        // Map to match expected structure
        const mappedOrders = (data || []).map(order => ({
          ...order,
          orderNumber: order.order_number,
          orderDate: order.order_date,
          paymentStatus: order.payment_status as PaymentStatus,
          customerId: order.customer_id,
          customerName: order.customer?.name || 'Unknown Customer',
          customerEmail: order.customer?.email,
          taxAmount: Number(order.tax_amount),
          totalAmount: Number(order.total_amount),
          deliveryDate: order.delivery_date,
          createdAt: order.created_at,
          updatedAt: order.updated_at
        }))
        setOrders(mappedOrders)
      }
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [business, filters])

  // Calculate order totals
  const calculateOrderTotal = useCallback(async (
    items: CreateOrderItemRequest[], 
    discountAmount = 0
  ): Promise<OrderTotal> => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax_amount = subtotal * 0.15 // 15% VAT for South Africa
    const total_amount = subtotal + tax_amount - discountAmount

    return {
      subtotal,
      tax_amount,
      discount_amount: discountAmount,
      total_amount: Math.max(0, total_amount)
    }
  }, [])

  // Create new order
  const createOrder = useCallback(async (orderData: any): Promise<Order> => {
    if (!business) throw new Error('No business selected')

    try {
      // Calculate totals
      const totals = await calculateOrderTotal(orderData.items, orderData.discountAmount || 0)
      
      // Generate order number using Supabase function
      const { data: orderNumber } = await supabase
        .rpc('generate_order_number', { business_id_param: business.id })
      
      // Create order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          business_id: business.id,
          customer_id: orderData.customerId,
          order_number: orderNumber || generateOrderNumber(),
          status: 'pending',
          subtotal: totals.subtotal,
          tax_amount: totals.tax_amount,
          total_amount: totals.total_amount,
          payment_status: 'unpaid',
          notes: orderData.notes,
          delivery_date: orderData.deliveryDate,
          created_by: user?.id
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map((item: CreateOrderItemRequest) => ({
          order_id: newOrder.id,
          product_id: item.product_id,
          inventory_id: item.inventory_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) throw itemsError
      }

      // Refresh orders list
      await fetchOrders()

      return newOrder as Order
    } catch (err) {
      console.error('Error creating order:', err)
      throw err
    }
  }, [business, user, calculateOrderTotal, generateOrderNumber, fetchOrders])

  // Update order
  const updateOrder = useCallback(async (orderId: string, updates: any): Promise<Order> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      // Refresh orders list
      await fetchOrders()

      return data as Order
    } catch (err) {
      console.error('Error updating order:', err)
      throw err
    }
  }, [fetchOrders])

  // Update order status
  const updateOrderStatus = useCallback(async (
    orderId: string, 
    status: OrderStatus, 
    notes?: string
  ): Promise<void> => {
    await updateOrder(orderId, { status, notes })
  }, [updateOrder])

  // Delete order
  const deleteOrder = useCallback(async (orderId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error

      // Refresh orders list
      await fetchOrders()
    } catch (err) {
      console.error('Error deleting order:', err)
      throw err
    }
  }, [fetchOrders])

  // Validate inventory (placeholder)
  const validateInventory = useCallback(async (items: CreateOrderItemRequest[]) => {
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

  // Load orders on mount
  useEffect(() => {
    if (business) {
      fetchOrders()
    }
  }, [business?.id]) // Only depend on business.id

  return {
    orders,
    loading,
    error,
    timeoutError,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    validateInventory,
    calculateOrderTotal,
    refreshOrders
  } as const
}
