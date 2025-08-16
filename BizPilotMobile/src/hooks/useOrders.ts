import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { OfflineManager } from '../services/offlineManager';
import { mcp_supabase_execute_sql } from '../services/mcpClient';

interface Order {
  id: string;
  business_id: string;
  customer_id: string | null;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  notes: string | null;
  order_date: string;
  delivery_date: string | null;
  customer_name?: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CreateOrderData {
  customer_id?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
  notes?: string;
}

export function useOrders() {
  const { user, business } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!business?.id) return;

    try {
      setLoading(true);
      
      // Check if offline
      const isOffline = false; // Would check actual network status using NetInfo
      
      if (isOffline) {
        const cachedOrders = await OfflineManager.getCachedData('orders');
        if (cachedOrders) {
          setOrders(cachedOrders);
          return;
        }
      }

      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            o.*,
            c.name as customer_name,
            jsonb_agg(
              jsonb_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'total_price', oi.total_price
              ) ORDER BY oi.created_at
            ) FILTER (WHERE oi.id IS NOT NULL) as items
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.business_id = $1
          GROUP BY o.id, c.name
          ORDER BY o.order_date DESC, o.created_at DESC
        `,
        params: [business.id]
      });

      if (result.success) {
        const ordersData = result.data || [];
        setOrders(ordersData);
        
        // Cache for offline use
        await OfflineManager.cacheData('orders', ordersData);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: CreateOrderData) => {
    if (!business?.id || !user?.id) throw new Error('Missing required data');

    try {
      // Check if offline
      const isOffline = false; // Would check actual network status
      
      if (isOffline) {
        await OfflineManager.queueOperation({
          type: 'CREATE_ORDER',
          data: orderData,
          businessId: business.id,
          userId: user.id,
        });
        return 'offline_order_' + Date.now();
      }

      // Generate order number
      const orderNumberResult = await mcp_supabase_execute_sql({
        query: `
          SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '\\\\d+') AS INTEGER)), 0) + 1 as next_number
          FROM orders 
          WHERE business_id = $1 
          AND order_number ~ '^ORD-\\\\d+$'
        `,
        params: [business.id]
      });

      const nextNumber = orderNumberResult.success && orderNumberResult.data?.[0]?.next_number || 1;
      const orderNumber = `ORD-${String(nextNumber).padStart(6, '0')}`;

      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxRate = 0.08; // 8% tax - should be configurable
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      // Create order
      const orderResult = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO orders (
            business_id, customer_id, order_number, 
            subtotal, tax_amount, total_amount, 
            notes, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `,
        params: [
          business.id,
          orderData.customer_id || null,
          orderNumber,
          subtotal,
          taxAmount,
          totalAmount,
          orderData.notes || null,
          user.id
        ]
      });

      if (!orderResult.success || !orderResult.data?.[0]?.id) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResult.data[0].id;

      // Create order items
      for (const item of orderData.items) {
        const totalPrice = item.quantity * item.unit_price;

        await mcp_supabase_execute_sql({
          query: `
            INSERT INTO order_items (
              order_id, product_id, product_name, 
              quantity, unit_price, total_price
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `,
          params: [orderId, item.product_id, 'Product Name', item.quantity, item.unit_price, totalPrice]
        });

        // Update inventory
        await mcp_supabase_execute_sql({
          query: `
            UPDATE inventory 
            SET current_quantity = current_quantity - $1,
                updated_at = now()
            WHERE product_id = $2 AND business_id = $3 AND current_quantity >= $1
          `,
          params: [item.quantity, item.product_id, business.id]
        });
      }

      await fetchOrders(); // Refresh orders list
      return orderId;
    } catch (err) {
      console.error('Error creating order:', err);
      throw new Error('Failed to create order');
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          UPDATE orders 
          SET status = $1, updated_at = now()
          WHERE id = $2 AND business_id = $3
        `,
        params: [status, orderId, business?.id]
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update order status');
      }

      await fetchOrders(); // Refresh orders list
    } catch (err) {
      console.error('Error updating order status:', err);
      throw new Error('Failed to update order status');
    }
  };

  useEffect(() => {
    if (business?.id) {
      fetchOrders();
    }
  }, [business?.id]);

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    refreshOrders: fetchOrders
  };
} 