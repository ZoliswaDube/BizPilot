-- Payment and Invoicing System
-- This migration adds comprehensive payment processing and invoicing capabilities

-- Payment methods table (South African payment methods)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('card', 'eft', 'bank_transfer', 'cash', 'mobile_payment', 'other')),
  provider text, -- 'payfast', 'yoco', 'ozow', 'snapscan', 'zapper', 'stripe'
  provider_payment_method_id text, -- External provider ID
  last4 text, -- Last 4 digits for cards
  brand text, -- Visa, Mastercard, etc.
  bank_name text, -- For EFT: 'FNB', 'Nedbank', 'Standard Bank', 'ABSA', 'Capitec'
  account_number text, -- Masked bank account
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  invoice_id uuid, -- Will be linked after invoice table creation
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  
  -- Payment details
  payment_number text UNIQUE NOT NULL,
  amount decimal(12,2) NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'ZAR' NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled')),
  
  -- Provider details (South African payment providers)
  provider text, -- 'payfast', 'yoco', 'ozow', 'snapscan', 'manual', 'eft'
  provider_payment_id text, -- External payment ID
  provider_customer_id text,
  
  -- Additional info
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  failure_reason text,
  refund_amount decimal(12,2) DEFAULT 0,
  refunded_at timestamptz,
  
  -- Timestamps
  paid_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Invoice details
  invoice_number text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'refunded')),
  
  -- Amounts
  subtotal decimal(12,2) NOT NULL DEFAULT 0,
  tax_amount decimal(12,2) NOT NULL DEFAULT 0,
  discount_amount decimal(12,2) NOT NULL DEFAULT 0,
  total_amount decimal(12,2) NOT NULL DEFAULT 0,
  amount_paid decimal(12,2) NOT NULL DEFAULT 0,
  amount_due decimal(12,2) NOT NULL DEFAULT 0,
  
  -- Dates
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  paid_date date,
  
  -- Additional details
  notes text,
  terms text,
  payment_instructions text,
  
  -- South African business details
  vat_number text, -- VAT registration number
  company_registration text, -- Company/CK registration number
  bank_name text, -- Bank for EFT payments
  bank_account_number text, -- Account number (display on invoice)
  bank_branch_code text, -- Branch code
  bank_account_type text, -- 'Current', 'Savings', 'Transmission'
  
  -- Addresses (JSON for flexibility)
  billing_address jsonb,
  shipping_address jsonb,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  pdf_url text, -- Stored PDF URL
  
  -- Timestamps
  sent_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Item details
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity decimal(10,2) NOT NULL CHECK (quantity > 0),
  unit_price decimal(12,2) NOT NULL CHECK (unit_price >= 0),
  discount_percentage decimal(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  tax_percentage decimal(5,2) DEFAULT 15 CHECK (tax_percentage >= 0 AND tax_percentage <= 100), -- 15% VAT (South Africa)
  
  -- Calculated amounts
  subtotal decimal(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  discount_amount decimal(12,2) GENERATED ALWAYS AS (quantity * unit_price * discount_percentage / 100) STORED,
  tax_amount decimal(12,2) GENERATED ALWAYS AS ((quantity * unit_price - (quantity * unit_price * discount_percentage / 100)) * tax_percentage / 100) STORED,
  total_amount decimal(12,2) GENERATED ALWAYS AS (quantity * unit_price - (quantity * unit_price * discount_percentage / 100) + ((quantity * unit_price - (quantity * unit_price * discount_percentage / 100)) * tax_percentage / 100)) STORED,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Link payments to invoices
ALTER TABLE public.payments ADD CONSTRAINT fk_payments_invoice 
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Payment history/transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction details
  type text NOT NULL CHECK (type IN ('authorization', 'capture', 'refund', 'void', 'chargeback')),
  amount decimal(12,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  
  -- Provider details
  provider_transaction_id text,
  provider_response jsonb,
  
  -- Error handling
  error_code text,
  error_message text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_payments_business_id ON public.payments(business_id);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);

CREATE INDEX idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoices_created_at ON public.invoices(created_at DESC);

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_payment_methods_business_id ON public.payment_methods(business_id);
CREATE INDEX idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Users can view their business payment methods"
  ON public.payment_methods FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM public.business_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can manage payment methods"
  ON public.payment_methods FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM public.business_users 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
    )
  );

-- RLS Policies for payments
CREATE POLICY "Users can view their business payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM public.business_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins and managers can manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM public.business_users 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
    )
  );

-- RLS Policies for invoices
CREATE POLICY "Users can view their business invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM public.business_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins and managers can manage invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM public.business_users 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
    )
  );

-- RLS Policies for invoice_items
CREATE POLICY "Users can view invoice items for their business"
  ON public.invoice_items FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE business_id IN (
        SELECT business_id FROM public.business_users 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Admins and managers can manage invoice items"
  ON public.invoice_items FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE business_id IN (
        SELECT business_id FROM public.business_users 
        WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
      )
    )
  );

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view payment transactions for their business"
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING (
    payment_id IN (
      SELECT id FROM public.payments
      WHERE business_id IN (
        SELECT business_id FROM public.business_users 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Functions for generating numbers
CREATE OR REPLACE FUNCTION public.generate_payment_number(business_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  payment_count integer;
  business_code text;
BEGIN
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3)) INTO business_code
  FROM public.businesses WHERE id = business_id_param;
  
  IF business_code IS NULL OR LENGTH(business_code) < 3 THEN
    business_code := 'BIZ';
  END IF;
  
  SELECT COUNT(*) + 1 INTO payment_count
  FROM public.payments WHERE business_id = business_id_param;
  
  RETURN 'PAY-' || business_code || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(payment_count::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number(business_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  invoice_count integer;
  business_code text;
BEGIN
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3)) INTO business_code
  FROM public.businesses WHERE id = business_id_param;
  
  IF business_code IS NULL OR LENGTH(business_code) < 3 THEN
    business_code := 'BIZ';
  END IF;
  
  SELECT COUNT(*) + 1 INTO invoice_count
  FROM public.invoices WHERE business_id = business_id_param;
  
  RETURN 'INV-' || business_code || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(invoice_count::text, 4, '0');
END;
$$;

-- Trigger to update invoice totals when items change
CREATE OR REPLACE FUNCTION public.update_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.invoices
  SET 
    subtotal = (
      SELECT COALESCE(SUM(subtotal), 0)
      FROM public.invoice_items
      WHERE invoice_id = NEW.invoice_id
    ),
    tax_amount = (
      SELECT COALESCE(SUM(tax_amount), 0)
      FROM public.invoice_items
      WHERE invoice_id = NEW.invoice_id
    ),
    discount_amount = (
      SELECT COALESCE(SUM(discount_amount), 0)
      FROM public.invoice_items
      WHERE invoice_id = NEW.invoice_id
    ),
    total_amount = (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM public.invoice_items
      WHERE invoice_id = NEW.invoice_id
    ),
    amount_due = (
      SELECT COALESCE(SUM(total_amount), 0) - COALESCE((SELECT SUM(amount) FROM public.payments WHERE invoice_id = NEW.invoice_id AND status = 'succeeded'), 0)
      FROM public.invoice_items
      WHERE invoice_id = NEW.invoice_id
    ),
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_invoice_totals_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_totals();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_payment_number TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invoice_number TO authenticated;

-- Comments
COMMENT ON TABLE public.payments IS 'Stores all payment transactions for orders and invoices';
COMMENT ON TABLE public.invoices IS 'Professional invoices with line items and payment tracking';
COMMENT ON TABLE public.invoice_items IS 'Individual line items on invoices with automatic calculations';
COMMENT ON TABLE public.payment_methods IS 'Stored payment methods for businesses';
COMMENT ON TABLE public.payment_transactions IS 'Detailed transaction history for each payment';
