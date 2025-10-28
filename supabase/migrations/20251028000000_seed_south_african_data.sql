-- =====================================================
-- SOUTH AFRICAN PRODUCTION DATA SEED
-- =====================================================
-- This seed creates realistic South African business data
-- Including customers, products, invoices, and payments in ZAR
-- Date: October 28, 2025
-- =====================================================

-- First, let's create some South African customers with VAT numbers
INSERT INTO customers (
  business_id, 
  name, 
  email, 
  phone, 
  company, 
  address,
  tags,
  preferred_contact_method,
  is_active,
  created_at
) VALUES 
-- Johannesburg Customers
(
  (SELECT id FROM businesses LIMIT 1),
  'Mandla Nkosi',
  'mandla.nkosi@protechsa.co.za',
  '+27 11 234 5678',
  'ProTech Solutions (Pty) Ltd',
  '{"street": "123 Rivonia Road", "city": "Sandton", "state": "Gauteng", "postal_code": "2196", "country": "South Africa"}',
  ARRAY['vip', 'corporate', 'gauteng'],
  'email',
  true,
  NOW() - INTERVAL '6 months'
),
-- Cape Town Customer
(
  (SELECT id FROM businesses LIMIT 1),
  'Sarah van der Merwe',
  'sarah@capetownretail.co.za',
  '+27 21 456 7890',
  'Cape Town Retail Group',
  '{"street": "45 Long Street", "city": "Cape Town", "state": "Western Cape", "postal_code": "8001", "country": "South Africa"}',
  ARRAY['retail', 'western-cape'],
  'email',
  true,
  NOW() - INTERVAL '4 months'
),
-- Durban Customer
(
  (SELECT id FROM businesses LIMIT 1),
  'Thabo Mthembu',
  'thabo@durzmanufacturing.co.za',
  '+27 31 345 6789',
  'Durban Manufacturing Co',
  '{"street": "78 Brickfield Road", "city": "Durban", "state": "KwaZulu-Natal", "postal_code": "4001", "country": "South Africa"}',
  ARRAY['manufacturing', 'kzn'],
  'phone',
  true,
  NOW() - INTERVAL '8 months'
),
-- Pretoria Customer
(
  (SELECT id FROM businesses LIMIT 1),
  'Nomsa Dlamini',
  'nomsa@ptaservices.co.za',
  '+27 12 567 8901',
  'Pretoria Business Services',
  '{"street": "56 Church Street", "city": "Pretoria", "state": "Gauteng", "postal_code": "0002", "country": "South Africa"}',
  ARRAY['services', 'government-approved'],
  'email',
  true,
  NOW() - INTERVAL '3 months'
),
-- Small Business Owner
(
  (SELECT id FROM businesses LIMIT 1),
  'Sipho Radebe',
  'sipho@sowetotrade.co.za',
  '+27 11 789 0123',
  'Soweto Trading Store',
  '{"street": "89 Vilakazi Street", "city": "Soweto", "state": "Gauteng", "postal_code": "1804", "country": "South Africa"}',
  ARRAY['smme', 'local'],
  'sms',
  true,
  NOW() - INTERVAL '2 months'
),
-- Port Elizabeth Customer
(
  (SELECT id FROM businesses LIMIT 1),
  'Johan Botha',
  'johan@pelogistics.co.za',
  '+27 41 234 5678',
  'PE Logistics Solutions',
  '{"street": "12 Marine Drive", "city": "Gqeberha", "state": "Eastern Cape", "postal_code": "6001", "country": "South Africa"}',
  ARRAY['logistics', 'eastern-cape'],
  'email',
  true,
  NOW() - INTERVAL '5 months'
);

-- Get the business_id and customer IDs for later use
DO $$
DECLARE
  v_business_id UUID;
  v_customer_1 UUID;
  v_customer_2 UUID;
  v_customer_3 UUID;
  v_customer_4 UUID;
  v_customer_5 UUID;
  v_customer_6 UUID;
  v_invoice_1 UUID;
  v_invoice_2 UUID;
  v_invoice_3 UUID;
  v_invoice_4 UUID;
  v_invoice_5 UUID;
BEGIN
  -- Get business ID
  SELECT id INTO v_business_id FROM businesses LIMIT 1;
  
  -- Get customer IDs
  SELECT id INTO v_customer_1 FROM customers WHERE email = 'mandla.nkosi@protechsa.co.za';
  SELECT id INTO v_customer_2 FROM customers WHERE email = 'sarah@capetownretail.co.za';
  SELECT id INTO v_customer_3 FROM customers WHERE email = 'thabo@durzmanufacturing.co.za';
  SELECT id INTO v_customer_4 FROM customers WHERE email = 'nomsa@ptaservices.co.za';
  SELECT id INTO v_customer_5 FROM customers WHERE email = 'sipho@sowetotrade.co.za';
  SELECT id INTO v_customer_6 FROM customers WHERE email = 'johan@pelogistics.co.za';

  -- =====================================================
  -- CREATE INVOICES (ZAR Currency, 15% VAT)
  -- =====================================================

  -- Invoice 1: PAID - Large Corporate (ProTech Solutions)
  INSERT INTO invoices (
    id,
    business_id,
    customer_id,
    invoice_number,
    status,
    issue_date,
    due_date,
    paid_date,
    notes,
    terms,
    payment_instructions,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_business_id,
    v_customer_1,
    'INV-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0001',
    'paid',
    CURRENT_DATE - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE - INTERVAL '10 days',
    'Enterprise software licensing and implementation services for Q1 2025',
    'Payment due within 30 days. Late payments subject to 2% monthly interest as per NCR regulations.',
    'Please make payment via EFT to: Standard Bank, Account: 1234567890, Branch: 051001, Reference: INV-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0001',
    CURRENT_DATE - INTERVAL '45 days'
  ) RETURNING id INTO v_invoice_1;

  -- Invoice 1 Items
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, discount_percentage, tax_percentage)
  VALUES 
    (v_invoice_1, 'Enterprise Software License (Annual)', 1, 85000.00, 0, 15),
    (v_invoice_1, 'Implementation & Setup Services', 40, 1250.00, 10, 15),
    (v_invoice_1, 'Training Sessions (5 days)', 5, 3500.00, 0, 15);

  -- Invoice 2: SENT - Awaiting Payment (Cape Town Retail)
  INSERT INTO invoices (
    id,
    business_id,
    customer_id,
    invoice_number,
    status,
    issue_date,
    due_date,
    notes,
    terms,
    payment_instructions,
    sent_at,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_business_id,
    v_customer_2,
    'INV-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0002',
    'sent',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '15 days',
    'Point of Sale system installation and configuration',
    'Payment due within 30 days of invoice date.',
    'Bank: FNB, Account: 62234567890, Branch: 250655, Ref: INV-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0002',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE - INTERVAL '15 days'
  ) RETURNING id INTO v_invoice_2;

  -- Invoice 2 Items
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, discount_percentage, tax_percentage)
  VALUES 
    (v_invoice_2, 'POS Hardware System', 3, 12500.00, 0, 15),
    (v_invoice_2, 'Software License (3 terminals)', 3, 2500.00, 0, 15),
    (v_invoice_2, 'Installation & Configuration', 1, 8750.00, 0, 15),
    (v_invoice_2, 'Staff Training', 1, 4500.00, 0, 15);

  -- Invoice 3: OVERDUE - Partial Payment (Durban Manufacturing)
  INSERT INTO invoices (
    id,
    business_id,
    customer_id,
    invoice_number,
    status,
    issue_date,
    due_date,
    notes,
    terms,
    payment_instructions,
    sent_at,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_business_id,
    v_customer_3,
    'INV-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0003',
    'overdue',
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '30 days',
    'Inventory management system upgrade and data migration services',
    'Payment terms: 50% upfront, 50% on completion. Overdue balance subject to interest.',
    'Bank: Nedbank, Account: 1234567890, Branch: 198765, Ref: INV-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0003',
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '60 days'
  ) RETURNING id INTO v_invoice_3;

  -- Invoice 3 Items
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, discount_percentage, tax_percentage)
  VALUES 
    (v_invoice_3, 'Inventory Management Software', 1, 45000.00, 0, 15),
    (v_invoice_3, 'Data Migration Services', 1, 25000.00, 0, 15),
    (v_invoice_3, 'System Integration', 80, 750.00, 5, 15),
    (v_invoice_3, 'On-site Support (2 weeks)', 10, 3500.00, 0, 15);

  -- Invoice 4: VIEWED - Customer Opened (Pretoria Services)
  INSERT INTO invoices (
    id,
    business_id,
    customer_id,
    invoice_number,
    status,
    issue_date,
    due_date,
    notes,
    terms,
    payment_instructions,
    sent_at,
    viewed_at,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_business_id,
    v_customer_4,
    'INV-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0004',
    'viewed',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '25 days',
    'Monthly consulting services for February 2025',
    'Payment due by end of month. Government purchase order required.',
    'Bank: ABSA, Account: 4054123456, Branch: 632005, Ref: INV-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0004',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '3 days',
    CURRENT_DATE - INTERVAL '5 days'
  ) RETURNING id INTO v_invoice_4;

  -- Invoice 4 Items
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, discount_percentage, tax_percentage)
  VALUES 
    (v_invoice_4, 'Business Consulting (20 hours)', 20, 1500.00, 0, 15),
    (v_invoice_4, 'Process Optimization Services', 1, 12000.00, 0, 15),
    (v_invoice_4, 'Report Generation & Analysis', 1, 4500.00, 0, 15);

  -- Invoice 5: DRAFT - Not Yet Sent (PE Logistics)
  INSERT INTO invoices (
    id,
    business_id,
    customer_id,
    invoice_number,
    status,
    issue_date,
    due_date,
    notes,
    terms,
    payment_instructions,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_business_id,
    v_customer_6,
    'INV-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0005',
    'draft',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'Fleet management software and GPS tracking system',
    'Payment due within 30 days of invoice date.',
    'Bank: Capitec, Account: 1234567890, Branch: 470010, Ref: INV-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0005',
    CURRENT_DATE
  ) RETURNING id INTO v_invoice_5;

  -- Invoice 5 Items
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, discount_percentage, tax_percentage)
  VALUES 
    (v_invoice_5, 'Fleet Management Software (Annual)', 1, 35000.00, 15, 15),
    (v_invoice_5, 'GPS Tracking Devices', 15, 1250.00, 10, 15),
    (v_invoice_5, 'Installation Services', 15, 450.00, 0, 15),
    (v_invoice_5, 'Training & Support (3 months)', 1, 8500.00, 0, 15);

  -- =====================================================
  -- CREATE PAYMENTS (ZAR, South African Methods)
  -- =====================================================

  -- Payment 1: Full payment for Invoice 1 (ProTech) via EFT
  INSERT INTO payments (
    business_id,
    invoice_id,
    payment_number,
    amount,
    currency,
    status,
    provider,
    provider_payment_id,
    description,
    refund_amount,
    paid_at,
    created_at
  ) VALUES (
    v_business_id,
    v_invoice_1,
    'PAY-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0001',
    (SELECT total_amount FROM invoices WHERE id = v_invoice_1),
    'ZAR',
    'succeeded',
    'eft',
    'EFT-STD-' || to_char(CURRENT_DATE - INTERVAL '10 days', 'YYYYMMDD') || '-' || floor(random() * 1000000)::text,
    'Full payment via Standard Bank EFT - ProTech Solutions Enterprise License',
    0,
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE - INTERVAL '10 days'
  );

  -- Payment 2: Partial payment for Invoice 3 (50% upfront) via EFT
  INSERT INTO payments (
    business_id,
    invoice_id,
    payment_number,
    amount,
    currency,
    status,
    provider,
    provider_payment_id,
    description,
    refund_amount,
    paid_at,
    created_at
  ) VALUES (
    v_business_id,
    v_invoice_3,
    'PAY-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0002',
    ROUND((SELECT total_amount FROM invoices WHERE id = v_invoice_3) * 0.5, 2),
    'ZAR',
    'succeeded',
    'eft',
    'EFT-NED-' || to_char(CURRENT_DATE - INTERVAL '55 days', 'YYYYMMDD') || '-' || floor(random() * 1000000)::text,
    '50% upfront payment - Durban Manufacturing inventory system',
    0,
    CURRENT_DATE - INTERVAL '55 days',
    CURRENT_DATE - INTERVAL '55 days'
  );

  -- Payment 3: Yoco card payment for a small invoice
  INSERT INTO payments (
    business_id,
    payment_number,
    amount,
    currency,
    status,
    provider,
    provider_payment_id,
    description,
    refund_amount,
    paid_at,
    created_at
  ) VALUES (
    v_business_id,
    'PAY-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0003',
    8625.00,
    'ZAR',
    'succeeded',
    'yoco',
    'YO-' || floor(random() * 10000000000000000)::text,
    'Walk-in customer card payment - Soweto Trading Store supplies',
    0,
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE - INTERVAL '7 days'
  );

  -- Payment 4: SnapScan QR payment
  INSERT INTO payments (
    business_id,
    payment_number,
    amount,
    currency,
    status,
    provider,
    provider_payment_id,
    description,
    refund_amount,
    paid_at,
    created_at
  ) VALUES (
    v_business_id,
    'PAY-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0004',
    5750.00,
    'ZAR',
    'succeeded',
    'snapscan',
    'SS-' || floor(random() * 1000000000000)::text,
    'SnapScan QR code payment - Mobile consultation fee',
    0,
    CURRENT_DATE - INTERVAL '3 days',
    CURRENT_DATE - INTERVAL '3 days'
  );

  -- Payment 5: Cash payment
  INSERT INTO payments (
    business_id,
    payment_number,
    amount,
    currency,
    status,
    provider,
    description,
    refund_amount,
    paid_at,
    created_at
  ) VALUES (
    v_business_id,
    'PAY-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0005',
    1250.00,
    'ZAR',
    'succeeded',
    'cash',
    'Cash payment received at office - Small business consultation',
    0,
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE - INTERVAL '2 days'
  );

  -- Payment 6: Pending PayFast payment
  INSERT INTO payments (
    business_id,
    payment_number,
    amount,
    currency,
    status,
    provider,
    provider_payment_id,
    description,
    refund_amount,
    created_at
  ) VALUES (
    v_business_id,
    'PAY-' || UPPER(SUBSTRING((SELECT name FROM businesses WHERE id = v_business_id LIMIT 1), 1, 3)) || '-2025-0006',
    3450.00,
    'ZAR',
    'pending',
    'payfast',
    'PF-' || floor(random() * 1000000)::text,
    'PayFast online payment - Processing',
    0,
    CURRENT_DATE - INTERVAL '1 hour'
  );

  RAISE NOTICE 'South African seed data created successfully!';
  RAISE NOTICE 'Created 6 customers, 5 invoices, and 6 payments in ZAR';
END $$;

-- =====================================================
-- VERIFY DATA
-- =====================================================

-- Show summary of created data
DO $$
DECLARE
  v_total_invoices INT;
  v_total_payments INT;
  v_total_invoiced NUMERIC;
  v_total_received NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_total_invoices FROM invoices 
    WHERE invoice_number LIKE 'INV-%2025%';
  
  SELECT COUNT(*) INTO v_total_payments FROM payments 
    WHERE payment_number LIKE 'PAY-%2025%';
  
  SELECT COALESCE(SUM(total_amount), 0) INTO v_total_invoiced FROM invoices 
    WHERE invoice_number LIKE 'INV-%2025%';
  
  SELECT COALESCE(SUM(amount), 0) INTO v_total_received FROM payments 
    WHERE payment_number LIKE 'PAY-%2025%' AND status = 'succeeded';
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'SOUTH AFRICAN DATA SEED SUMMARY';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total Invoices Created: %', v_total_invoices;
  RAISE NOTICE 'Total Payments Created: %', v_total_payments;
  RAISE NOTICE 'Total Invoiced Amount: R %.2f ZAR', v_total_invoiced;
  RAISE NOTICE 'Total Received Amount: R %.2f ZAR', v_total_received;
  RAISE NOTICE 'Outstanding Amount: R %.2f ZAR', v_total_invoiced - v_total_received;
  RAISE NOTICE '================================================';
END $$;
