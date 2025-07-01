/*
  # Enhanced Database Schema with Categories, Suppliers, and Extended Product Features

  1. New Tables
    - `categories` - Product categories with hierarchical support
    - `suppliers` - Supplier management
    - `inventory_transactions` - Track all inventory changes

  2. Enhanced Existing Tables
    - `products` - Add SKU, stock levels, supplier/category links, images, etc.
    - `inventory` - Add product linking, batch tracking, expiration dates

  3. Security & Performance
    - Enable RLS on all new tables
    - Add appropriate indexes
    - Add foreign key constraints
    - Add data integrity checks
*/

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  attributes jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own suppliers"
  ON public.suppliers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inventory_id uuid REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('add', 'remove', 'adjustment', 'sale', 'purchase', 'initial')),
  quantity_change decimal(10,2) NOT NULL,
  new_quantity decimal(10,2) NOT NULL,
  transaction_date timestamptz DEFAULT now() NOT NULL,
  notes text
);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own inventory transactions"
  ON public.inventory_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON public.inventory_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON public.inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON public.inventory_transactions(transaction_date);

-- Add missing columns to products table
DO $$
BEGIN
  -- Add sku column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sku' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products ADD COLUMN sku text;
  END IF;

  -- Add min_stock_level column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'min_stock_level' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products ADD COLUMN min_stock_level decimal(10,2);
  END IF;

  -- Add reorder_point column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'reorder_point' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products ADD COLUMN reorder_point decimal(10,2);
  END IF;

  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'location' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products ADD COLUMN location text;
  END IF;

  -- Add supplier_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'supplier_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products ADD COLUMN supplier_id uuid;
  END IF;

  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'image_url' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products ADD COLUMN image_url text;
  END IF;

  -- Add barcode column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'barcode' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products ADD COLUMN barcode text;
  END IF;

  -- Add category_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products ADD COLUMN category_id uuid;
  END IF;
END $$;

-- Add missing columns to inventory table
DO $$
BEGIN
  -- Add product_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' AND column_name = 'product_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.inventory ADD COLUMN product_id uuid;
  END IF;

  -- Add batch_lot_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' AND column_name = 'batch_lot_number' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.inventory ADD COLUMN batch_lot_number text;
  END IF;

  -- Add expiration_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' AND column_name = 'expiration_date' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.inventory ADD COLUMN expiration_date date;
  END IF;
END $$;

-- Add foreign key constraints now that columns exist
DO $$
BEGIN
  -- Add foreign key constraint for supplier_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_supplier_id_fkey' 
    AND table_name = 'products'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT products_supplier_id_fkey 
    FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key constraint for category_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_category_id_fkey' 
    AND table_name = 'products'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key constraint for inventory product_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inventory_product_id_fkey' 
    AND table_name = 'inventory'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.inventory 
    ADD CONSTRAINT inventory_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batch_lot ON public.inventory(batch_lot_number);
CREATE INDEX IF NOT EXISTS idx_inventory_expiration ON public.inventory(expiration_date);