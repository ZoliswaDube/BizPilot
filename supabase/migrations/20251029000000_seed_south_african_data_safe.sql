-- =====================================================
-- SOUTH AFRICAN DATA SEED (SAFE VERSION)
-- =====================================================
-- This seed creates realistic South African business data
-- Safe to run multiple times - skips duplicates
-- Date: October 29, 2025
-- =====================================================

-- Start transaction
BEGIN;

-- First, clean up any existing seed data (optional - comment out if you want to keep existing data)
DELETE FROM invoice_items WHERE invoice_id IN (
  SELECT id FROM invoices WHERE invoice_number LIKE 'INV-%-2025-%'
);
DELETE FROM invoices WHERE invoice_number LIKE 'INV-%-2025-%';
DELETE FROM products WHERE sku IN (
  'SW-ENT-2025',
  'HOST-PREM-2025',
  'SUPP-MONTH-2025',
  'HARD-INST-2025',
  'TRAIN-DAY-2025'
);
DELETE FROM customers WHERE email IN (
  'mandla.nkosi@protechsa.co.za',
  'sarah@capetownretail.co.za',
  'thabo@durzmanufacturing.co.za',
  'nomsa@ptaservices.co.za',
  'sipho@sowetotrade.co.za',
  'johan@pelogistics.co.za'
);

-- Insert South African customers (with ON CONFLICT to skip duplicates)
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
-- Johannesburg Customer
(
  (SELECT id FROM businesses LIMIT 1),
  'Mandla Nkosi',
  'mandla.nkosi@protechsa.co.za',
  '+27 11 234 5678',
  'ProTech Solutions (Pty) Ltd',
  '{"street": "123 Rivonia Road", "city": "Sandton", "state": "Gauteng", "postal_code": "2196", "country": "South Africa"}'::jsonb,
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
  '{"street": "45 Long Street", "city": "Cape Town", "state": "Western Cape", "postal_code": "8001", "country": "South Africa"}'::jsonb,
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
  '{"street": "78 Brickfield Road", "city": "Durban", "state": "KwaZulu-Natal", "postal_code": "4001", "country": "South Africa"}'::jsonb,
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
  '{"street": "56 Church Street", "city": "Pretoria", "state": "Gauteng", "postal_code": "0002", "country": "South Africa"}'::jsonb,
  ARRAY['services', 'government-approved'],
  'email',
  true,
  NOW() - INTERVAL '3 months'
),
-- Soweto Customer
(
  (SELECT id FROM businesses LIMIT 1),
  'Sipho Radebe',
  'sipho@sowetotrade.co.za',
  '+27 11 789 0123',
  'Soweto Trading Store',
  '{"street": "89 Vilakazi Street", "city": "Soweto", "state": "Gauteng", "postal_code": "1804", "country": "South Africa"}'::jsonb,
  ARRAY['smme', 'local'],
  'sms',
  true,
  NOW() - INTERVAL '2 months'
),
-- Gqeberha Customer
(
  (SELECT id FROM businesses LIMIT 1),
  'Johan Botha',
  'johan@pelogistics.co.za',
  '+27 41 234 5678',
  'PE Logistics Solutions',
  '{"street": "12 Marine Drive", "city": "Gqeberha", "state": "Eastern Cape", "postal_code": "6001", "country": "South Africa"}'::jsonb,
  ARRAY['logistics', 'eastern-cape'],
  'email',
  true,
  NOW() - INTERVAL '5 months'
)
ON CONFLICT (email) DO NOTHING;

-- Insert South African products
INSERT INTO products (
  business_id,
  name,
  price,
  sku,
  stock_quantity,
  low_stock_threshold,
  is_active,
  created_at
) VALUES
(
  (SELECT id FROM businesses LIMIT 1),
  'Enterprise Software License - Annual (50 users)',
  125000.00,
  'SW-ENT-2025',
  100,
  10,
  true,
  NOW() - INTERVAL '3 months'
),
(
  (SELECT id FROM businesses LIMIT 1),
  'Cloud Hosting Package - Premium',
  4500.00,
  'HOST-PREM-2025',
  999,
  50,
  true,
  NOW() - INTERVAL '2 months'
),
(
  (SELECT id FROM businesses LIMIT 1),
  'IT Support Services - Monthly',
  8500.00,
  'SUPP-MONTH-2025',
  999,
  1,
  true,
  NOW() - INTERVAL '4 months'
),
(
  (SELECT id FROM businesses LIMIT 1),
  'Hardware Installation Service',
  15000.00,
  'HARD-INST-2025',
  50,
  5,
  true,
  NOW() - INTERVAL '1 month'
),
(
  (SELECT id FROM businesses LIMIT 1),
  'Training & Consulting - Per Day',
  12000.00,
  'TRAIN-DAY-2025',
  999,
  1,
  true,
  NOW() - INTERVAL '5 months'
)
ON CONFLICT (sku) DO NOTHING;

-- Success message
SELECT 
  (SELECT COUNT(*) FROM customers WHERE email LIKE '%@%sa.co.za' OR email LIKE '%sowetotrade.co.za' OR email LIKE '%pelogistics.co.za') as customers_added,
  (SELECT COUNT(*) FROM products WHERE sku LIKE '%-2025') as products_added;

COMMIT;

-- =====================================================
-- END OF SEED
-- =====================================================
