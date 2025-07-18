/*
  # Create BizPilot Database Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `total_cost` (decimal)
      - `labor_minutes` (integer)
      - `selling_price` (decimal)
      - `profit_margin` (decimal)
      - `created_at` (timestamp)
    
    - `ingredients`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `name` (text)
      - `cost` (decimal)
      - `quantity` (decimal)
      - `unit` (text)
    
    - `inventory`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `current_quantity` (decimal)
      - `unit` (text)
      - `low_stock_alert` (decimal)
      - `cost_per_unit` (decimal)
      - `updated_at` (timestamp)
    
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `business_name` (text)
      - `hourly_rate` (decimal)
      - `default_margin` (decimal)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  total_cost decimal(10,2) DEFAULT 0.00,
  labor_minutes integer DEFAULT 0,
  selling_price decimal(10,2) DEFAULT 0.00,
  profit_margin decimal(5,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own products"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  cost decimal(10,2) NOT NULL DEFAULT 0.00,
  quantity decimal(10,2) NOT NULL DEFAULT 0.00,
  unit text NOT NULL DEFAULT 'unit'
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage ingredients for their products"
  ON ingredients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = ingredients.product_id 
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = ingredients.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  current_quantity decimal(10,2) NOT NULL DEFAULT 0.00,
  unit text NOT NULL DEFAULT 'unit',
  low_stock_alert decimal(10,2) DEFAULT 5.00,
  cost_per_unit decimal(10,2) NOT NULL DEFAULT 0.00,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own inventory"
  ON inventory
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name text,
  hourly_rate decimal(10,2) DEFAULT 15.00,
  default_margin decimal(5,2) DEFAULT 40.00
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_product_id ON ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);