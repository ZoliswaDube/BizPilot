/*
  # Business and User Management System

  This migration adds:
  1. Businesses table - Each user belongs to a business
  2. User roles table - Define roles within a business
  3. User permissions table - Granular permissions for each role
  4. Business users table - Link users to businesses with roles
  5. Updated existing tables to use business_id instead of user_id
*/

-- Businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Business policies
CREATE POLICY "Business admins can manage their business"
  ON public.businesses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = businesses.id 
      AND business_users.user_id = auth.uid() 
      AND business_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = businesses.id 
      AND business_users.user_id = auth.uid() 
      AND business_users.role = 'admin'
    )
  );

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- 'admin', 'manager', 'employee', etc.
  description text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(business_id, name)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Business admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = user_roles.business_id 
      AND business_users.user_id = auth.uid() 
      AND business_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = user_roles.business_id 
      AND business_users.user_id = auth.uid() 
      AND business_users.role = 'admin'
    )
  );

-- User permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES public.user_roles(id) ON DELETE CASCADE NOT NULL,
  resource text NOT NULL, -- 'products', 'inventory', 'categories', 'suppliers', 'ai', 'qr', 'settings', 'users'
  action text NOT NULL, -- 'create', 'read', 'update', 'delete', 'manage'
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(role_id, resource, action)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- User permissions policies
CREATE POLICY "Business admins can manage permissions"
  ON public.user_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.business_users bu ON bu.business_id = ur.business_id
      WHERE ur.id = user_permissions.role_id 
      AND bu.user_id = auth.uid() 
      AND bu.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.business_users bu ON bu.business_id = ur.business_id
      WHERE ur.id = user_permissions.role_id 
      AND bu.user_id = auth.uid() 
      AND bu.role = 'admin'
    )
  );

-- Business users table
CREATE TABLE IF NOT EXISTS public.business_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'employee', -- 'admin', 'manager', 'employee'
  is_active boolean DEFAULT true,
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(business_id, user_id)
);

-- Enable RLS
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;

-- Business users policies
CREATE POLICY "Users can view their own business memberships"
  ON public.business_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Business admins can manage business users"
  ON public.business_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users bu2
      WHERE bu2.business_id = business_users.business_id 
      AND bu2.user_id = auth.uid() 
      AND bu2.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users bu2
      WHERE bu2.business_id = business_users.business_id 
      AND bu2.user_id = auth.uid() 
      AND bu2.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_businesses_name ON public.businesses(name);
CREATE INDEX IF NOT EXISTS idx_user_roles_business_id ON public.user_roles(business_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_role_id ON public.user_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_business_users_business_id ON public.business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_user_id ON public.business_users(user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_role ON public.business_users(role);

-- Add business_id to existing tables
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);

-- Create indexes for business_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_id ON public.user_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_business_id ON public.user_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_business_id ON public.inventory(business_id);
CREATE INDEX IF NOT EXISTS idx_categories_business_id ON public.categories(business_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_business_id ON public.suppliers(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_business_id ON public.inventory_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_business_id ON public.ai_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_business_id ON public.qr_codes(business_id);

-- Update RLS policies to use business_id
-- Products
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;
CREATE POLICY "Users can manage their business products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = products.business_id 
      AND business_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = products.business_id 
      AND business_users.user_id = auth.uid()
    )
  );

-- Inventory
DROP POLICY IF EXISTS "Users can manage their own inventory" ON public.inventory;
CREATE POLICY "Users can manage their business inventory"
  ON public.inventory
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = inventory.business_id 
      AND business_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = inventory.business_id 
      AND business_users.user_id = auth.uid()
    )
  );

-- Categories
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their business categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = categories.business_id 
      AND business_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = categories.business_id 
      AND business_users.user_id = auth.uid()
    )
  );

-- Suppliers
DROP POLICY IF EXISTS "Users can manage their own suppliers" ON public.suppliers;
CREATE POLICY "Users can manage their business suppliers"
  ON public.suppliers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = suppliers.business_id 
      AND business_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = suppliers.business_id 
      AND business_users.user_id = auth.uid()
    )
  );

-- Inventory transactions
DROP POLICY IF EXISTS "Users can manage their own inventory transactions" ON public.inventory_transactions;
CREATE POLICY "Users can manage their business inventory transactions"
  ON public.inventory_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = inventory_transactions.business_id 
      AND business_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = inventory_transactions.business_id 
      AND business_users.user_id = auth.uid()
    )
  );

-- AI conversations
DROP POLICY IF EXISTS "Users can manage their own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users can manage their business AI conversations"
  ON public.ai_conversations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = ai_conversations.business_id 
      AND business_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = ai_conversations.business_id 
      AND business_users.user_id = auth.uid()
    )
  );

-- QR codes
DROP POLICY IF EXISTS "Users can manage their own QR codes" ON public.qr_codes;
CREATE POLICY "Users can manage their business QR codes"
  ON public.qr_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = qr_codes.business_id 
      AND business_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = qr_codes.business_id 
      AND business_users.user_id = auth.uid()
    )
  );

-- User profiles
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.user_profiles;
CREATE POLICY "Users can manage their business profiles"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = user_profiles.business_id 
      AND business_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = user_profiles.business_id 
      AND business_users.user_id = auth.uid()
    )
  );

-- User settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their business settings"
  ON public.user_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = user_settings.business_id 
      AND business_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = user_settings.business_id 
      AND business_users.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_users_updated_at
  BEFORE UPDATE ON public.business_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default roles for new businesses
CREATE OR REPLACE FUNCTION create_default_business_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Create admin role
  INSERT INTO public.user_roles (business_id, name, description, is_default)
  VALUES (NEW.id, 'admin', 'Full access to all features', true);
  
  -- Create manager role
  INSERT INTO public.user_roles (business_id, name, description, is_default)
  VALUES (NEW.id, 'manager', 'Can manage products, inventory, and reports', false);
  
  -- Create employee role
  INSERT INTO public.user_roles (business_id, name, description, is_default)
  VALUES (NEW.id, 'employee', 'Can view and update inventory', false);
  
  -- Add permissions for admin role
  INSERT INTO public.user_permissions (role_id, resource, action)
  SELECT 
    ur.id,
    resource,
    action
  FROM public.user_roles ur
  CROSS JOIN (
    VALUES 
      ('products', 'create'), ('products', 'read'), ('products', 'update'), ('products', 'delete'),
      ('inventory', 'create'), ('inventory', 'read'), ('inventory', 'update'), ('inventory', 'delete'),
      ('categories', 'create'), ('categories', 'read'), ('categories', 'update'), ('categories', 'delete'),
      ('suppliers', 'create'), ('suppliers', 'read'), ('suppliers', 'update'), ('suppliers', 'delete'),
      ('ai', 'create'), ('ai', 'read'), ('ai', 'update'), ('ai', 'delete'),
      ('qr', 'create'), ('qr', 'read'), ('qr', 'update'), ('qr', 'delete'),
      ('settings', 'read'), ('settings', 'update'),
      ('users', 'create'), ('users', 'read'), ('users', 'update'), ('users', 'delete')
  ) AS permissions(resource, action)
  WHERE ur.business_id = NEW.id AND ur.name = 'admin';
  
  -- Add permissions for manager role
  INSERT INTO public.user_permissions (role_id, resource, action)
  SELECT 
    ur.id,
    resource,
    action
  FROM public.user_roles ur
  CROSS JOIN (
    VALUES 
      ('products', 'create'), ('products', 'read'), ('products', 'update'),
      ('inventory', 'create'), ('inventory', 'read'), ('inventory', 'update'),
      ('categories', 'read'),
      ('suppliers', 'read'),
      ('ai', 'read'),
      ('qr', 'read'),
      ('settings', 'read')
  ) AS permissions(resource, action)
  WHERE ur.business_id = NEW.id AND ur.name = 'manager';
  
  -- Add permissions for employee role
  INSERT INTO public.user_permissions (role_id, resource, action)
  SELECT 
    ur.id,
    resource,
    action
  FROM public.user_roles ur
  CROSS JOIN (
    VALUES 
      ('products', 'read'),
      ('inventory', 'read'), ('inventory', 'update'),
      ('categories', 'read'),
      ('suppliers', 'read')
  ) AS permissions(resource, action)
  WHERE ur.business_id = NEW.id AND ur.name = 'employee';
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for new businesses
CREATE TRIGGER create_default_business_roles_trigger
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION create_default_business_roles(); 