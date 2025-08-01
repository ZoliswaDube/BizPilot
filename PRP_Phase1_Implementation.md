# BizPilot Phase 1 - Product Requirements Prompt (PRP)
## Critical MVP Features Implementation Guide

**Document Version:** 2.0  
**Phase:** 1 (Critical MVP Features)  
**Timeline:** 4 Weeks  
**Priority:** P0 (Critical for MVP launch)  
**Database Integration:** Mandatory Supabase MCP Server  

---

## 🎯 Phase 1 Overview

**Objective:** Implement core business-critical features that enable BizPilot to function as a complete business management system capable of handling sales, financial tracking, and customer management.

**CRITICAL REQUIREMENT**: All database operations MUST use the **Supabase MCP Server** for security, auditability, and maintainability.

**Success Criteria:**
- Complete sales order lifecycle management
- Automated financial reporting capabilities
- Customer database with purchase history
- Seamless integration with existing inventory system
- Production-ready implementation with MCP server integration
- Zero direct Supabase client database operations

---

## 🛒 Feature 1: Sales & Order Management System
**Priority:** P0 | **Timeline:** Weeks 1-2 | **Complexity:** High

### Implementation Prompt

**Context:** "You are implementing a comprehensive sales and order management system for BizPilot using the Supabase MCP Server for all database operations. The system must integrate seamlessly with existing inventory management and provide complete order lifecycle tracking."

**Technical Requirements:**
- All database operations via `mcp_supabase_execute_sql` and `mcp_supabase_apply_migration`
- Real-time inventory updates when orders are processed
- Order status workflow automation
- Integration with existing business and user management systems

### Database Schema Implementation

**Step 1: Create Database Schema via MCP Server**
```typescript
// Use mcp_supabase_apply_migration for all DDL operations
const createOrdersSchema = async () => {
  await mcp_supabase_apply_migration({
    name: 'create_orders_and_order_items_tables',
    query: `
      -- Orders table
      CREATE TABLE IF NOT EXISTS public.orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
        customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
        order_number text NOT NULL,
        status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
        subtotal decimal(10,2) NOT NULL DEFAULT 0,
        tax_amount decimal(10,2) NOT NULL DEFAULT 0,
        total_amount decimal(10,2) NOT NULL DEFAULT 0,
        payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
        notes text,
        order_date timestamptz DEFAULT now() NOT NULL,
        delivery_date timestamptz,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        created_by uuid REFERENCES auth.users(id),
        UNIQUE(business_id, order_number)
      );

      -- Order items table
      CREATE TABLE IF NOT EXISTS public.order_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
        product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT,
        inventory_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
        product_name text NOT NULL, -- Store name in case product is deleted
        quantity integer NOT NULL CHECK (quantity > 0),
        unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
        total_price decimal(10,2) NOT NULL CHECK (total_price >= 0),
        created_at timestamptz DEFAULT now() NOT NULL
      );

      -- Enable RLS
      ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

      -- RLS Policies for orders
      CREATE POLICY "Users can access orders from their business"
        ON public.orders FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.business_users 
            WHERE business_users.business_id = orders.business_id 
            AND business_users.user_id = auth.uid()
            AND business_users.is_active = true
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.business_users 
            WHERE business_users.business_id = orders.business_id 
            AND business_users.user_id = auth.uid()
            AND business_users.is_active = true
          )
        );

      -- RLS Policies for order_items
      CREATE POLICY "Users can access order items from their business"
        ON public.order_items FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.business_users bu ON bu.business_id = o.business_id
            WHERE o.id = order_items.order_id
            AND bu.user_id = auth.uid()
            AND bu.is_active = true
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.business_users bu ON bu.business_id = o.business_id
            WHERE o.id = order_items.order_id
            AND bu.user_id = auth.uid()
            AND bu.is_active = true
          )
        );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_orders_business_id ON public.orders(business_id);
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

      -- Updated at trigger
      CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON public.orders
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    `
  })
}
```

### Frontend Implementation

**Step 2: Create Order Management Hook**
```typescript
// src/hooks/useOrders.ts
import { useState, useEffect } from 'react'
import { mcp_supabase_execute_sql } from '@mcp/supabase'
import { useAuthStore } from '../store/auth'
import { useBusiness } from './useBusiness'

interface Order {
  id: string
  business_id: string
  customer_id: string | null
  order_number: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  tax_amount: number
  total_amount: number
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
  notes: string | null
  order_date: string
  delivery_date: string | null
  customer_name?: string
  items: OrderItem[]
}

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export function useOrders() {
  const { user } = useAuthStore()
  const { business } = useBusiness()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch orders using MCP server
  const fetchOrders = async () => {
    if (!business?.id) return

    try {
      setLoading(true)
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
      })

      setOrders(result.data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  // Create order using MCP server
  const createOrder = async (orderData: {
    customer_id?: string
    items: Array<{
      product_id: string
      quantity: number
      unit_price: number
    }>
    notes?: string
  }) => {
    if (!business?.id || !user?.id) throw new Error('Missing required data')

    try {
      // Generate order number
      const orderNumberResult = await mcp_supabase_execute_sql({
        query: `
          SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '\\d+') AS INTEGER)), 0) + 1 as next_number
          FROM orders 
          WHERE business_id = $1 
          AND order_number ~ '^ORD-\\d+$'
        `,
        params: [business.id]
      })

      const orderNumber = `ORD-${String(orderNumberResult.data[0]?.next_number || 1).padStart(6, '0')}`

      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      const taxRate = 0.08 // 8% tax - should be configurable
      const taxAmount = subtotal * taxRate
      const totalAmount = subtotal + taxAmount

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
      })

      const orderId = orderResult.data[0].id

      // Create order items
      for (const item of orderData.items) {
        // Get product name
        const productResult = await mcp_supabase_execute_sql({
          query: 'SELECT name FROM products WHERE id = $1',
          params: [item.product_id]
        })

        const productName = productResult.data[0]?.name || 'Unknown Product'
        const totalPrice = item.quantity * item.unit_price

        await mcp_supabase_execute_sql({
          query: `
            INSERT INTO order_items (
              order_id, product_id, product_name, 
              quantity, unit_price, total_price
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `,
          params: [orderId, item.product_id, productName, item.quantity, item.unit_price, totalPrice]
        })

        // Update inventory if available
        await mcp_supabase_execute_sql({
          query: `
            UPDATE inventory 
            SET current_quantity = current_quantity - $1,
                updated_at = now()
            WHERE product_id = $2 AND business_id = $3 AND current_quantity >= $1
          `,
          params: [item.quantity, item.product_id, business.id]
        })
      }

      await fetchOrders() // Refresh orders list
      return orderId
    } catch (err) {
      console.error('Error creating order:', err)
      throw new Error('Failed to create order')
    }
  }

  // Update order status using MCP server
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await mcp_supabase_execute_sql({
        query: `
          UPDATE orders 
          SET status = $1, updated_at = now()
          WHERE id = $2 AND business_id = $3
        `,
        params: [status, orderId, business?.id]
      })

      await fetchOrders() // Refresh orders list
    } catch (err) {
      console.error('Error updating order status:', err)
      throw new Error('Failed to update order status')
    }
  }

  useEffect(() => {
    if (business?.id) {
      fetchOrders()
    }
  }, [business?.id])

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    refreshOrders: fetchOrders
  }
}
```

**Step 3: Create Order Management Component**
```typescript
// src/components/orders/OrderManagement.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Plus, Search, Filter } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { OrderForm } from './OrderForm'
import { OrderList } from './OrderList'

export function OrderManagement() {
  const { orders, loading, error, createOrder, updateOrderStatus } = useOrders()
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateOrder = async (orderData: any) => {
    try {
      await createOrder(orderData)
      setShowOrderForm(false)
    } catch (err) {
      console.error('Failed to create order:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-dark-950 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Order Management</h1>
            <p className="text-gray-400">Track and manage customer orders</p>
          </div>
          <button
            onClick={() => setShowOrderForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Order</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <OrderList 
          orders={filteredOrders} 
          onUpdateStatus={updateOrderStatus}
        />

        {/* Order Form Modal */}
        {showOrderForm && (
          <OrderForm
            onClose={() => setShowOrderForm(false)}
            onSubmit={handleCreateOrder}
          />
        )}
      </div>
    </motion.div>
  )
}
```

### Quality Standards
- ✅ All database operations via Supabase MCP Server
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Real-time inventory updates when orders are processed
- ✅ RLS policies automatically enforced by MCP server
- ✅ Audit trail through MCP server logging
- ✅ Performance optimization with proper indexing
- ✅ Mobile-responsive design
- ✅ Accessibility compliance (ARIA labels, keyboard navigation)

---

## 👥 Feature 2: Customer Management System
**Priority:** P0 | **Timeline:** Week 3 | **Complexity:** Medium

### Implementation Prompt

**Context:** "You are implementing a customer management system that integrates with the order system and provides comprehensive customer tracking using the Supabase MCP Server for all database operations."

**Technical Requirements:**
- All database operations via `mcp_supabase_execute_sql` and `mcp_supabase_apply_migration`
- Customer purchase history aggregation
- Integration with orders system
- Search and filtering capabilities

### Database Schema Implementation

```typescript
// Use mcp_supabase_apply_migration for customer schema
const createCustomersSchema = async () => {
  await mcp_supabase_apply_migration({
    name: 'create_customers_table',
    query: `
      -- Customers table
      CREATE TABLE IF NOT EXISTS public.customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
        name text NOT NULL,
        email text,
        phone text,
        address jsonb,
        notes text,
        total_orders integer DEFAULT 0,
        total_spent decimal(10,2) DEFAULT 0,
        last_order_date timestamptz,
        customer_since timestamptz DEFAULT now() NOT NULL,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        created_by uuid REFERENCES auth.users(id)
      );

      -- Enable RLS
      ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

      -- RLS Policy
      CREATE POLICY "Users can access customers from their business"
        ON public.customers FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.business_users 
            WHERE business_users.business_id = customers.business_id 
            AND business_users.user_id = auth.uid()
            AND business_users.is_active = true
          )
        );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);
      CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
      CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers USING gin(to_tsvector('english', name));

      -- Updated at trigger
      CREATE TRIGGER update_customers_updated_at
        BEFORE UPDATE ON public.customers
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

      -- Function to update customer statistics
      CREATE OR REPLACE FUNCTION update_customer_stats()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Update customer statistics when orders change
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
          UPDATE customers SET
            total_orders = (
              SELECT COUNT(*) FROM orders 
              WHERE customer_id = NEW.customer_id AND status != 'cancelled'
            ),
            total_spent = (
              SELECT COALESCE(SUM(total_amount), 0) FROM orders 
              WHERE customer_id = NEW.customer_id AND status != 'cancelled'
            ),
            last_order_date = (
              SELECT MAX(order_date) FROM orders 
              WHERE customer_id = NEW.customer_id
            ),
            updated_at = now()
          WHERE id = NEW.customer_id;
        END IF;

        IF TG_OP = 'DELETE' THEN
          UPDATE customers SET
            total_orders = (
              SELECT COUNT(*) FROM orders 
              WHERE customer_id = OLD.customer_id AND status != 'cancelled'
            ),
            total_spent = (
              SELECT COALESCE(SUM(total_amount), 0) FROM orders 
              WHERE customer_id = OLD.customer_id AND status != 'cancelled'
            ),
            last_order_date = (
              SELECT MAX(order_date) FROM orders 
              WHERE customer_id = OLD.customer_id
            ),
            updated_at = now()
          WHERE id = OLD.customer_id;
        END IF;

        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;

      -- Trigger to update customer stats on order changes
      CREATE TRIGGER update_customer_stats_trigger
        AFTER INSERT OR UPDATE OR DELETE ON orders
        FOR EACH ROW
        WHEN (NEW.customer_id IS NOT NULL OR OLD.customer_id IS NOT NULL)
        EXECUTE FUNCTION update_customer_stats();
    `
  })
}
```

### Frontend Implementation

```typescript
// src/hooks/useCustomers.ts
import { useState, useEffect } from 'react'
import { mcp_supabase_execute_sql } from '@mcp/supabase'
import { useBusiness } from './useBusiness'

interface Customer {
  id: string
  business_id: string
  name: string
  email: string | null
  phone: string | null
  address: any
  notes: string | null
  total_orders: number
  total_spent: number
  last_order_date: string | null
  customer_since: string
  is_active: boolean
}

export function useCustomers() {
  const { business } = useBusiness()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCustomers = async () => {
    if (!business?.id) return

    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT * FROM customers 
          WHERE business_id = $1 
          ORDER BY total_spent DESC, last_order_date DESC NULLS LAST
        `,
        params: [business.id]
      })

      setCustomers(result.data || [])
    } catch (err) {
      console.error('Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'business_id' | 'total_orders' | 'total_spent' | 'last_order_date' | 'customer_since'>) => {
    if (!business?.id) throw new Error('No business selected')

    try {
      await mcp_supabase_execute_sql({
        query: `
          INSERT INTO customers (business_id, name, email, phone, address, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        params: [
          business.id,
          customerData.name,
          customerData.email,
          customerData.phone,
          customerData.address,
          customerData.notes
        ]
      })

      await fetchCustomers()
    } catch (err) {
      console.error('Error creating customer:', err)
      throw err
    }
  }

  useEffect(() => {
    if (business?.id) {
      fetchCustomers()
    }
  }, [business?.id])

  return {
    customers,
    loading,
    createCustomer,
    refreshCustomers: fetchCustomers
  }
}
```

---

## 💰 Feature 3: Financial Reporting & Expense Tracking
**Priority:** P0 | **Timeline:** Week 4 | **Complexity:** High

### Implementation Prompt

**Context:** "You are implementing a comprehensive financial reporting system that tracks expenses, revenue, and generates automated financial reports using the Supabase MCP Server for all database operations and calculations."

### Database Schema Implementation

```typescript
const createFinancialSchema = async () => {
  await mcp_supabase_apply_migration({
    name: 'create_financial_tables',
    query: `
      -- Expense categories
      CREATE TABLE IF NOT EXISTS public.expense_categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
        name text NOT NULL,
        description text,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now() NOT NULL,
        UNIQUE(business_id, name)
      );

      -- Expenses table
      CREATE TABLE IF NOT EXISTS public.expenses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
        category_id uuid REFERENCES public.expense_categories(id),
        amount decimal(10,2) NOT NULL CHECK (amount > 0),
        description text NOT NULL,
        receipt_url text,
        expense_date date NOT NULL,
        is_recurring boolean DEFAULT false,
        recurring_frequency text CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
        tags text[],
        created_at timestamptz DEFAULT now() NOT NULL,
        created_by uuid REFERENCES auth.users(id)
      );

      -- Financial reports table
      CREATE TABLE IF NOT EXISTS public.financial_reports (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
        report_type text NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
        period_start date NOT NULL,
        period_end date NOT NULL,
        total_revenue decimal(10,2) DEFAULT 0,
        total_expenses decimal(10,2) DEFAULT 0,
        net_profit decimal(10,2) DEFAULT 0,
        gross_profit decimal(10,2) DEFAULT 0,
        profit_margin decimal(5,2) DEFAULT 0,
        total_orders integer DEFAULT 0,
        average_order_value decimal(10,2) DEFAULT 0,
        report_data jsonb,
        created_at timestamptz DEFAULT now() NOT NULL,
        created_by uuid REFERENCES auth.users(id),
        UNIQUE(business_id, report_type, period_start, period_end)
      );

      -- Enable RLS
      ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

      -- RLS Policies
      CREATE POLICY "Users can access expense categories from their business"
        ON public.expense_categories FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.business_users 
            WHERE business_users.business_id = expense_categories.business_id 
            AND business_users.user_id = auth.uid()
            AND business_users.is_active = true
          )
        );

      CREATE POLICY "Users can access expenses from their business"
        ON public.expenses FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.business_users 
            WHERE business_users.business_id = expenses.business_id 
            AND business_users.user_id = auth.uid()
            AND business_users.is_active = true
          )
        );

      CREATE POLICY "Users can access financial reports from their business"
        ON public.financial_reports FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.business_users 
            WHERE business_users.business_id = financial_reports.business_id 
            AND business_users.user_id = auth.uid()
            AND business_users.is_active = true
          )
        );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON public.expenses(business_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category_id);
      CREATE INDEX IF NOT EXISTS idx_financial_reports_business_period ON public.financial_reports(business_id, period_start, period_end);

      -- Function to generate financial report
      CREATE OR REPLACE FUNCTION generate_financial_report(
        p_business_id uuid,
        p_period_start date,
        p_period_end date,
        p_report_type text
      ) RETURNS uuid AS $$
      DECLARE
        report_id uuid;
        revenue_data record;
        expense_data record;
        order_data record;
      BEGIN
        -- Calculate revenue from orders
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(subtotal), 0) as gross_revenue,
          COUNT(*) as total_orders,
          COALESCE(AVG(total_amount), 0) as avg_order_value
        INTO revenue_data
        FROM orders 
        WHERE business_id = p_business_id 
        AND order_date::date BETWEEN p_period_start AND p_period_end
        AND status NOT IN ('cancelled');

        -- Calculate expenses
        SELECT 
          COALESCE(SUM(amount), 0) as total_expenses
        INTO expense_data
        FROM expenses 
        WHERE business_id = p_business_id 
        AND expense_date BETWEEN p_period_start AND p_period_end;

        -- Insert or update report
        INSERT INTO financial_reports (
          business_id, report_type, period_start, period_end,
          total_revenue, total_expenses, 
          net_profit, gross_profit, profit_margin,
          total_orders, average_order_value,
          report_data, created_by
        ) VALUES (
          p_business_id, p_report_type, p_period_start, p_period_end,
          revenue_data.total_revenue, expense_data.total_expenses,
          revenue_data.total_revenue - expense_data.total_expenses,
          revenue_data.gross_revenue,
          CASE 
            WHEN revenue_data.total_revenue > 0 
            THEN ((revenue_data.total_revenue - expense_data.total_expenses) / revenue_data.total_revenue) * 100
            ELSE 0 
          END,
          revenue_data.total_orders, revenue_data.avg_order_value,
          jsonb_build_object(
            'revenue_breakdown', revenue_data,
            'expense_breakdown', expense_data,
            'generated_at', now()
          ),
          auth.uid()
        )
        ON CONFLICT (business_id, report_type, period_start, period_end)
        DO UPDATE SET
          total_revenue = EXCLUDED.total_revenue,
          total_expenses = EXCLUDED.total_expenses,
          net_profit = EXCLUDED.net_profit,
          gross_profit = EXCLUDED.gross_profit,
          profit_margin = EXCLUDED.profit_margin,
          total_orders = EXCLUDED.total_orders,
          average_order_value = EXCLUDED.average_order_value,
          report_data = EXCLUDED.report_data,
          created_at = now()
        RETURNING id INTO report_id;

        RETURN report_id;
      END;
      $$ LANGUAGE plpgsql;

      -- Grant permissions
      GRANT EXECUTE ON FUNCTION generate_financial_report(uuid, date, date, text) TO authenticated;
    `
  })
}
```

---

## 🔧 Implementation Standards

### **MCP Server Integration Requirements:**

1. **All Database Operations:**
   ```typescript
   // ✅ CORRECT - Use MCP server
   await mcp_supabase_execute_sql({ query: '...', params: [...] })
   await mcp_supabase_apply_migration({ name: '...', query: '...' })
   
   // ❌ WRONG - Direct client usage
   await supabase.from('table').select('*')
   ```

2. **Error Handling:**
   ```typescript
   try {
     const result = await mcp_supabase_execute_sql({
       query: 'SELECT * FROM orders WHERE id = $1',
       params: [orderId]
     })
     return result.data
   } catch (error) {
     console.error('MCP Server operation failed:', error)
     throw new Error('Database operation failed')
   }
   ```

3. **Security Validation:**
   ```typescript
   // Regular security checks using MCP server
   const checkSecurity = async () => {
     const advisors = await mcp_supabase_get_advisors({ type: 'security' })
     console.log('Security advisors:', advisors)
   }
   ```

### **Quality Checklist:**

- ✅ All database operations via MCP server
- ✅ RLS policies implemented and tested
- ✅ Proper indexing for performance
- ✅ Comprehensive error handling
- ✅ Mobile-responsive UI
- ✅ Accessibility compliance
- ✅ Real-time updates where appropriate
- ✅ Data validation on client and server
- ✅ Audit trails via MCP server logging
- ✅ Performance monitoring setup

---

## 🎯 Success Metrics

### **Technical Metrics:**
- 100% MCP server usage for database operations
- <200ms response time for all queries
- Zero RLS policy violations
- 100% test coverage for critical paths

### **Business Metrics:**
- Complete order-to-cash workflow
- Real-time financial reporting
- Customer lifetime value tracking
- Inventory accuracy maintenance

### **Security Metrics:**
- All operations audited via MCP server
- Zero unauthorized data access
- Regular security advisor compliance
- Proper data encryption at rest and in transit

This PRP ensures that all Phase 1 features are implemented with mandatory Supabase MCP server integration, providing maximum security, auditability, and maintainability. 