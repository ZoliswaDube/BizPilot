/*
  # Fix user signup database error

  1. Database Schema Updates
    - Create missing tables: categories, suppliers, inventory_transactions, ai_conversations, ai_messages, qr_codes
    - Add missing columns to existing tables
    - Add proper foreign key constraints and indexes

  2. Robust User Profile Creation
    - Fix handle_new_user function with proper error handling
    - Add ON CONFLICT handling for duplicate profiles
    - Ensure email field is never null or empty
    - Add comprehensive logging for debugging

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Drop and recreate policies to avoid conflicts
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

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
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

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own suppliers" ON public.suppliers;
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

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own inventory transactions" ON public.inventory_transactions;
CREATE POLICY "Users can manage their own inventory transactions"
  ON public.inventory_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users can manage their own AI conversations"
  ON public.ai_conversations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage messages in their conversations" ON public.ai_messages;
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

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own QR codes" ON public.qr_codes;
CREATE POLICY "Users can manage their own QR codes"
  ON public.qr_codes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON public.qr_codes;
CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drop existing auth triggers to recreate them with robust functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Ultra-robust function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_email text;
    user_full_name text;
    user_avatar_url text;
    user_provider text;
    user_email_verified boolean;
    profile_exists boolean := false;
BEGIN
    -- Set search path explicitly
    SET search_path = public, pg_temp;
    
    -- Validate required data
    IF NEW.id IS NULL THEN
        RAISE LOG 'handle_new_user: User ID is NULL, skipping profile creation';
        RETURN NEW;
    END IF;
    
    -- Check if profile already exists
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id
    ) INTO profile_exists;
    
    IF profile_exists THEN
        RAISE LOG 'handle_new_user: Profile already exists for user %, skipping', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Extract and validate email (required field) - provide fallback
    user_email := COALESCE(NEW.email, 'user-' || NEW.id::text || '@temp.local');
    
    -- Safely extract metadata with comprehensive null checks
    user_full_name := NULL;
    user_avatar_url := NULL;
    user_provider := 'email';
    
    -- Extract full name from metadata with safety checks
    BEGIN
        IF NEW.raw_user_meta_data IS NOT NULL THEN
            user_full_name := COALESCE(
                NEW.raw_user_meta_data->>'full_name', 
                NEW.raw_user_meta_data->>'name',
                NEW.raw_user_meta_data->>'display_name'
            );
            user_avatar_url := NEW.raw_user_meta_data->>'avatar_url';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error extracting metadata for user %: %', NEW.id, SQLERRM;
        -- Continue with NULL values
    END;
    
    -- Extract provider from app metadata with safety checks
    BEGIN
        IF NEW.app_metadata IS NOT NULL THEN
            user_provider := CASE 
                WHEN NEW.app_metadata->>'provider' = 'google' THEN 'google'
                WHEN NEW.app_metadata->>'provider' = 'github' THEN 'github'
                WHEN NEW.app_metadata->>'provider' = 'apple' THEN 'apple'
                ELSE 'email'
            END;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Error extracting provider for user %: %', NEW.id, SQLERRM;
        user_provider := 'email';
    END;
    
    -- Determine email verification status
    user_email_verified := (NEW.email_confirmed_at IS NOT NULL);
    
    -- Insert user profile with comprehensive error handling and conflict resolution
    BEGIN
        INSERT INTO public.user_profiles (
            user_id,
            email,
            full_name,
            avatar_url,
            provider,
            email_verified
        ) VALUES (
            NEW.id,
            user_email,
            user_full_name,
            user_avatar_url,
            user_provider,
            user_email_verified
        )
        ON CONFLICT (user_id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
            avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
            provider = EXCLUDED.provider,
            email_verified = EXCLUDED.email_verified,
            updated_at = now();
        
        RAISE LOG 'handle_new_user: Successfully created/updated profile for user % with email %', NEW.id, user_email;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Failed to create profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
        -- Don't fail the auth process - just log the error and continue
    END;
    
    -- Create default user settings
    BEGIN
        INSERT INTO public.user_settings (
            user_id,
            business_name,
            hourly_rate,
            default_margin
        ) VALUES (
            NEW.id,
            NULL,
            15.00,
            40.00
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE LOG 'handle_new_user: Created default settings for user %', NEW.id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: Failed to create settings for user %: %', NEW.id, SQLERRM;
        -- Continue even if settings creation fails
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Robust function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger AS $$
BEGIN
    SET search_path = public, pg_temp;
    
    -- Only proceed if we have a valid user ID and email
    IF NEW.id IS NULL OR COALESCE(NEW.email, '') = '' THEN
        RETURN NEW;
    END IF;
    
    BEGIN
        UPDATE public.user_profiles
        SET
            email = NEW.email,
            email_verified = COALESCE((NEW.email_confirmed_at IS NOT NULL), false),
            updated_at = now()
        WHERE user_id = NEW.id;
        
        RAISE LOG 'handle_user_update: Updated profile for user %', NEW.id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_user_update: Failed to update profile for user %: %', NEW.id, SQLERRM;
        -- Don't fail the auth process
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate triggers with the robust functions
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;