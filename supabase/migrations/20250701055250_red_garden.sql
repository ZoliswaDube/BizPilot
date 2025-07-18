/*
  # Complete database schema update

  1. New Tables
    - `categories` - Product categories with hierarchical support
    - `suppliers` - Supplier information for products
    - `inventory_transactions` - Track inventory changes over time
    - `ai_conversations` - Store AI chat conversations
    - `ai_messages` - Store individual messages within conversations
    - `qr_codes` - Store QR code configurations for tip pages

  2. Schema Updates
    - Add missing columns to `products` table
    - Add missing columns to `inventory` table
    - Add foreign key relationships
    - Add proper indexes for performance

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data access
    - Add triggers for updated_at columns
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

-- Enable RLS only if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'categories' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policy only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Users can manage their own categories'
  ) THEN
    CREATE POLICY "Users can manage their own categories"
      ON public.categories
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

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

-- Enable RLS only if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'suppliers' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policy only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'suppliers' 
    AND policyname = 'Users can manage their own suppliers'
  ) THEN
    CREATE POLICY "Users can manage their own suppliers"
      ON public.suppliers
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

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

-- Enable RLS only if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'inventory_transactions' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policy only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inventory_transactions' 
    AND policyname = 'Users can manage their own inventory transactions'
  ) THEN
    CREATE POLICY "Users can manage their own inventory transactions"
      ON public.inventory_transactions
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON public.inventory_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON public.inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON public.inventory_transactions(transaction_date);

-- AI Conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS only if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'ai_conversations' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policy only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_conversations' 
    AND policyname = 'Users can manage their own AI conversations'
  ) THEN
    CREATE POLICY "Users can manage their own AI conversations"
      ON public.ai_conversations
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON public.ai_conversations(updated_at);

-- AI Messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_user boolean NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS only if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'ai_messages' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policy only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_messages' 
    AND policyname = 'Users can manage messages in their conversations'
  ) THEN
    CREATE POLICY "Users can manage messages in their conversations"
      ON public.ai_messages
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.ai_conversations 
          WHERE ai_conversations.id = ai_messages.conversation_id 
          AND ai_conversations.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.ai_conversations 
          WHERE ai_conversations.id = ai_messages.conversation_id 
          AND ai_conversations.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);

-- QR Codes table
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  business_name text,
  tip_amounts jsonb NOT NULL,
  custom_message text,
  qr_data_url text,
  page_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS only if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'qr_codes' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policy only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'qr_codes' 
    AND policyname = 'Users can manage their own QR codes'
  ) THEN
    CREATE POLICY "Users can manage their own QR codes"
      ON public.qr_codes
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_updated_at ON public.qr_codes(updated_at);

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

-- Create or replace the trigger function for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON public.qr_codes;
CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();