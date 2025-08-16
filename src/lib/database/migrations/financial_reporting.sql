-- Financial Reporting Schema Migration
-- This migration creates the financial tracking and reporting infrastructure

-- Expense categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(business_id, name)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  expense_number text NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  expense_date date DEFAULT CURRENT_DATE NOT NULL,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'cheque', 'other')),
  supplier_name text,
  receipt_url text,
  notes text,
  is_tax_deductible boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(business_id, expense_number)
);

-- Financial periods table (for period-based reporting)
CREATE TABLE IF NOT EXISTS public.financial_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(business_id, name),
  CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
DROP POLICY IF EXISTS "Users can access expense categories from their business" ON public.expense_categories;
CREATE POLICY "Users can access expense categories from their business"
  ON public.expense_categories FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = expense_categories.business_id 
      AND business_users.user_id = auth.uid()
      AND business_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = expense_categories.business_id 
      AND business_users.user_id = auth.uid()
      AND business_users.is_active = true
    )
  );

-- RLS Policies for expenses
DROP POLICY IF EXISTS "Users can access expenses from their business" ON public.expenses;
CREATE POLICY "Users can access expenses from their business"
  ON public.expenses FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = expenses.business_id 
      AND business_users.user_id = auth.uid()
      AND business_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = expenses.business_id 
      AND business_users.user_id = auth.uid()
      AND business_users.is_active = true
    )
  );

-- RLS Policies for financial_periods
DROP POLICY IF EXISTS "Users can access financial periods from their business" ON public.financial_periods;
CREATE POLICY "Users can access financial periods from their business"
  ON public.financial_periods FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = financial_periods.business_id 
      AND business_users.user_id = auth.uid()
      AND business_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users 
      WHERE business_users.business_id = financial_periods.business_id 
      AND business_users.user_id = auth.uid()
      AND business_users.is_active = true
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expense_categories_business_id ON public.expense_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON public.expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_financial_periods_business_id ON public.financial_periods(business_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS expense_categories_updated_at ON public.expense_categories;
CREATE TRIGGER expense_categories_updated_at 
  BEFORE UPDATE ON public.expense_categories 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS expenses_updated_at ON public.expenses;
CREATE TRIGGER expenses_updated_at 
  BEFORE UPDATE ON public.expenses 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS financial_periods_updated_at ON public.financial_periods;
CREATE TRIGGER financial_periods_updated_at 
  BEFORE UPDATE ON public.financial_periods 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to generate expense numbers
CREATE OR REPLACE FUNCTION generate_expense_number(business_id_param uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  expense_count integer;
  business_code text;
BEGIN
  -- Get business code from business table (first 3 chars of name, uppercase)
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3)) INTO business_code
  FROM businesses WHERE id = business_id_param;
  
  -- Default to 'BIZ' if business name is too short
  IF business_code IS NULL OR LENGTH(business_code) < 3 THEN
    business_code := 'BIZ';
  END IF;
  
  -- Get current expense count for this business
  SELECT COUNT(*) + 1 INTO expense_count
  FROM expenses WHERE business_id = business_id_param;
  
  -- Return formatted expense number: EXP-BIZ-2024-0001
  RETURN 'EXP-' || business_code || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(expense_count::text, 4, '0');
END;
$$;

-- Function to get comprehensive financial report
CREATE OR REPLACE FUNCTION get_financial_report(
  business_id_param uuid,
  start_date_param date DEFAULT NULL,
  end_date_param date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  report_data jsonb;
  revenue_data jsonb;
  expense_data jsonb;
  profit_loss jsonb;
  cash_flow jsonb;
  start_date date;
  end_date date;
BEGIN
  -- Set default date range if not provided (current month)
  IF start_date_param IS NULL THEN
    start_date := date_trunc('month', CURRENT_DATE);
  ELSE
    start_date := start_date_param;
  END IF;
  
  IF end_date_param IS NULL THEN
    end_date := date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day';
  ELSE
    end_date := end_date_param;
  END IF;

  -- Revenue analysis from orders
  SELECT jsonb_build_object(
    'total_revenue', COALESCE(SUM(total_amount), 0),
    'gross_revenue', COALESCE(SUM(subtotal), 0),
    'tax_collected', COALESCE(SUM(tax_amount), 0),
    'order_count', COUNT(*),
    'average_order_value', CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*) ELSE 0 END,
    'paid_revenue', COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0),
    'pending_revenue', COALESCE(SUM(CASE WHEN payment_status IN ('unpaid', 'partial') THEN total_amount ELSE 0 END), 0)
  ) INTO revenue_data
  FROM orders 
  WHERE business_id = business_id_param 
    AND order_date::date BETWEEN start_date AND end_date
    AND status NOT IN ('cancelled');

  -- Expense analysis
  SELECT jsonb_build_object(
    'total_expenses', COALESCE(SUM(amount), 0),
    'expense_count', COUNT(*),
    'average_expense', CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(amount), 0) / COUNT(*) ELSE 0 END,
    'tax_deductible_expenses', COALESCE(SUM(CASE WHEN is_tax_deductible THEN amount ELSE 0 END), 0),
    'by_category', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'category_name', COALESCE(ec.name, 'Uncategorized'),
          'total_amount', category_totals.total,
          'expense_count', category_totals.count
        )
      ), '[]'::jsonb
    )
  ) INTO expense_data
  FROM (
    SELECT 
      category_id,
      SUM(amount) as total,
      COUNT(*) as count
    FROM expenses 
    WHERE business_id = business_id_param 
      AND expense_date BETWEEN start_date AND end_date
    GROUP BY category_id
  ) category_totals
  LEFT JOIN expense_categories ec ON ec.id = category_totals.category_id;

  -- Profit & Loss calculation
  SELECT jsonb_build_object(
    'gross_profit', (revenue_data->>'gross_revenue')::decimal - (expense_data->>'total_expenses')::decimal,
    'net_profit', (revenue_data->>'total_revenue')::decimal - (expense_data->>'total_expenses')::decimal,
    'profit_margin', CASE 
      WHEN (revenue_data->>'total_revenue')::decimal > 0 
      THEN ((revenue_data->>'total_revenue')::decimal - (expense_data->>'total_expenses')::decimal) / (revenue_data->>'total_revenue')::decimal * 100
      ELSE 0 
    END
  ) INTO profit_loss;

  -- Cash flow analysis (simplified)
  SELECT jsonb_build_object(
    'cash_in', (revenue_data->>'paid_revenue')::decimal,
    'cash_out', (expense_data->>'total_expenses')::decimal,
    'net_cash_flow', (revenue_data->>'paid_revenue')::decimal - (expense_data->>'total_expenses')::decimal,
    'outstanding_receivables', (revenue_data->>'pending_revenue')::decimal
  ) INTO cash_flow;

  -- Combine all data
  report_data := jsonb_build_object(
    'period', jsonb_build_object(
      'start_date', start_date,
      'end_date', end_date
    ),
    'revenue', revenue_data,
    'expenses', expense_data,
    'profit_loss', profit_loss,
    'cash_flow', cash_flow,
    'generated_at', NOW()
  );

  RETURN report_data;
END;
$$;

-- Function to get order statistics
CREATE OR REPLACE FUNCTION get_order_statistics(business_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_orders', COUNT(*),
    'pending_orders', COUNT(*) FILTER (WHERE status = 'pending'),
    'completed_orders', COUNT(*) FILTER (WHERE status = 'delivered'),
    'total_revenue', COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('cancelled')), 0),
    'average_order_value', CASE 
      WHEN COUNT(*) FILTER (WHERE status NOT IN ('cancelled')) > 0 
      THEN COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('cancelled')), 0) / COUNT(*) FILTER (WHERE status NOT IN ('cancelled'))
      ELSE 0 
    END,
    'orders_this_month', COUNT(*) FILTER (WHERE order_date >= date_trunc('month', CURRENT_DATE)),
    'revenue_this_month', COALESCE(SUM(total_amount) FILTER (WHERE order_date >= date_trunc('month', CURRENT_DATE) AND status NOT IN ('cancelled')), 0)
  ) INTO stats
  FROM orders 
  WHERE business_id = business_id_param;
  
  RETURN stats;
END;
$$;

-- Function to get customer statistics
CREATE OR REPLACE FUNCTION get_customer_statistics(business_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  stats jsonb;
BEGIN
  WITH customer_stats AS (
    SELECT 
      c.id,
      c.name,
      COUNT(o.id) as total_orders,
      COALESCE(SUM(o.total_amount), 0) as total_spent,
      c.created_at
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id AND o.status NOT IN ('cancelled')
    WHERE c.business_id = business_id_param
    GROUP BY c.id, c.name, c.created_at
  )
  SELECT jsonb_build_object(
    'total_customers', COUNT(*),
    'new_customers_this_month', COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)),
    'repeat_customers', COUNT(*) FILTER (WHERE total_orders > 1),
    'top_customers', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'total_orders', total_orders,
          'total_spent', total_spent
        ) 
        ORDER BY total_spent DESC
      ) FILTER (WHERE total_orders > 0), 
      '[]'::jsonb
    )
  ) INTO stats
  FROM customer_stats;
  
  RETURN stats;
END;
$$;

-- Insert default expense categories for new businesses
CREATE OR REPLACE FUNCTION create_default_expense_categories(business_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO expense_categories (business_id, name, description) VALUES
    (business_id_param, 'Office Supplies', 'Stationery, equipment, and office materials'),
    (business_id_param, 'Marketing', 'Advertising, promotions, and marketing materials'),
    (business_id_param, 'Travel', 'Business travel and transportation expenses'),
    (business_id_param, 'Utilities', 'Internet, phone, electricity, and other utilities'),
    (business_id_param, 'Professional Services', 'Legal, accounting, consulting fees'),
    (business_id_param, 'Insurance', 'Business insurance premiums'),
    (business_id_param, 'Rent', 'Office or store rent payments'),
    (business_id_param, 'Equipment', 'Tools, machinery, and equipment purchases'),
    (business_id_param, 'Software', 'Software subscriptions and licenses'),
    (business_id_param, 'Other', 'Miscellaneous business expenses')
  ON CONFLICT (business_id, name) DO NOTHING;
END;
$$;
