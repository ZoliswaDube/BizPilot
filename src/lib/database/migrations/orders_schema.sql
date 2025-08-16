-- Orders and Order Items Schema Migration
-- This migration creates the core tables for the sales & order management system

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

-- Customers table (if not exists)
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'South Africa',
  customer_type text DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business')),
  tax_number text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(business_id, email) WHERE email IS NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
DROP POLICY IF EXISTS "Users can access orders from their business" ON public.orders;
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
DROP POLICY IF EXISTS "Users can access order items from their business orders" ON public.order_items;
CREATE POLICY "Users can access order items from their business orders"
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

-- RLS Policies for customers
DROP POLICY IF EXISTS "Users can access customers from their business" ON public.customers;
CREATE POLICY "Users can access customers from their business"
  ON public.customers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = customers.business_id 
      AND business_users.user_id = auth.uid()
      AND business_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = customers.business_id 
      AND business_users.user_id = auth.uid()
      AND business_users.is_active = true
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON public.orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email) WHERE email IS NOT NULL;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at 
  BEFORE UPDATE ON public.orders 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS customers_updated_at ON public.customers;
CREATE TRIGGER customers_updated_at 
  BEFORE UPDATE ON public.customers 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number(business_id_param uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  order_count integer;
  business_code text;
BEGIN
  -- Get business code from business table (first 3 chars of name, uppercase)
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3)) INTO business_code
  FROM businesses WHERE id = business_id_param;
  
  -- Default to 'BIZ' if business name is too short
  IF business_code IS NULL OR LENGTH(business_code) < 3 THEN
    business_code := 'BIZ';
  END IF;
  
  -- Get current order count for this business
  SELECT COUNT(*) + 1 INTO order_count
  FROM orders WHERE business_id = business_id_param;
  
  -- Return formatted order number: BIZ-2024-0001
  RETURN business_code || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(order_count::text, 4, '0');
END;
$$;
