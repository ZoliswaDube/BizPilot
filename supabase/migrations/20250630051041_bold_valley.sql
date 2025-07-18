/*
  # Add Missing Tables and Columns for BizPilot Features

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `parent_id` (uuid, nullable, self-reference for nested categories)
      - `attributes` (jsonb, for flexible category-specific attributes)
      - `created_at` (timestamp)
    
    - `suppliers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `contact_person` (text, nullable)
      - `email` (text, nullable)
      - `phone` (text, nullable)
      - `address` (text, nullable)
      - `created_at` (timestamp)
    
    - `inventory_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `inventory_id` (uuid, foreign key to inventory)
      - `type` (text, e.g., 'add', 'remove', 'adjustment')
      - `quantity_change` (decimal)
      - `new_quantity` (decimal)
      - `transaction_date` (timestamp)
      - `notes` (text, nullable)

  2. Enhanced Existing Tables
    - Add missing columns to `products` table
    - Add missing columns to `inventory` table

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add indexes for performance
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
  type text NOT NULL, -- 'add', 'remove', 'adjustment', 'sale', 'purchase'
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

-- Add any missing columns to existing tables (checking if they exist first)

-- Products table: Add foreign key constraints for the new relationships
DO $$
BEGIN
  -- Add foreign key constraint for supplier_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_supplier_id_fkey' 
    AND table_name = 'products'
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
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Inventory table: Add foreign key constraint for product_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inventory_product_id_fkey' 
    AND table_name = 'inventory'
  ) THEN
    ALTER TABLE public.inventory 
    ADD CONSTRAINT inventory_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for the new foreign key columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);

-- Add check constraints for data integrity
ALTER TABLE public.inventory_transactions 
ADD CONSTRAINT IF NOT EXISTS check_transaction_type 
CHECK (type IN ('add', 'remove', 'adjustment', 'sale', 'purchase', 'initial'));