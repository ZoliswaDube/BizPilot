# 🚀 Production Deployment Guide - South African Setup

**Date:** October 28, 2025  
**Status:** Ready for Deployment  
**Environment:** Production with ZAR Currency

---

## 📋 Prerequisites Checklist

- [ ] Supabase project created
- [ ] Environment variables configured (`.env`)
- [ ] Database migrations ready
- [ ] Edge Functions code ready
- [ ] Storage bucket will be created

---

## 🎯 Step 1: Run Database Seed (South African Data)

### Option A: Using Supabase CLI (Recommended)

```bash
# 1. Navigate to project directory
cd d:\Downloads\Personal_Projects\BizPilot

# 2. Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# 3. Run the migration
supabase db push

# 4. Apply the seed data
supabase db push --file supabase/migrations/20251028000000_seed_south_african_data.sql
```

### Option B: Using Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in sidebar
4. Click **New Query**
5. Copy entire content from `supabase/migrations/20251028000000_seed_south_african_data.sql`
6. Paste and click **Run**

### What This Creates:

✅ **6 South African Customers:**
- ProTech Solutions (Pty) Ltd - Sandton, Gauteng
- Cape Town Retail Group - Cape Town, Western Cape
- Durban Manufacturing Co - Durban, KwaZulu-Natal
- Pretoria Business Services - Pretoria, Gauteng
- Soweto Trading Store - Soweto, Gauteng
- PE Logistics Solutions - Gqeberha, Eastern Cape

✅ **5 Invoices (ZAR Currency, 15% VAT):**
- INV-2025-0001: R 177,272.50 - PAID (ProTech)
- INV-2025-0002: R 63,250.00 - SENT (Cape Town)
- INV-2025-0003: R 137,362.50 - OVERDUE (Durban)
- INV-2025-0004: R 49,450.00 - VIEWED (Pretoria)
- INV-2025-0005: R 50,137.50 - DRAFT (PE Logistics)

✅ **6 Payments (Multiple SA Providers):**
- R 177,272.50 - EFT (Standard Bank)
- R 68,681.25 - EFT (Nedbank) - 50% upfront
- R 8,625.00 - Yoco Card Payment
- R 5,750.00 - SnapScan QR
- R 1,250.00 - Cash
- R 3,450.00 - PayFast (Pending)

**Total Value Created:**
- Total Invoiced: ~R 477,472.50
- Total Received: ~R 261,578.75
- Outstanding: ~R 215,893.75

---

## 🔧 Step 2: Create Storage Bucket

### Using Supabase Dashboard:

1. Go to **Storage** in sidebar
2. Click **New bucket**
3. Configure:
   - **Name:** `documents`
   - **Public:** ✅ Yes
   - **File size limit:** 50MB
   - **Allowed MIME types:** `text/html, application/pdf`
4. Click **Create bucket**

### Using Supabase CLI:

```bash
# Create bucket via SQL
supabase db execute "
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  true, 
  52428800,
  ARRAY['text/html', 'application/pdf']::text[]
);
"
```

### Set Storage Policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Anyone can view documents (public bucket)
CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = owner);
```

---

## 📄 Step 3: Deploy Edge Function (PDF Generation)

### 3.1. Install Supabase CLI (if not installed)

```bash
# Windows (using Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or download from:
# https://github.com/supabase/cli/releases
```

### 3.2. Login to Supabase

```bash
supabase login
```

### 3.3. Deploy the Function

```bash
# Navigate to project root
cd d:\Downloads\Personal_Projects\BizPilot

# Deploy the Edge Function
supabase functions deploy generate-invoice-pdf

# If you need to set secrets:
supabase secrets set SOME_API_KEY=your_key_here
```

### 3.4. Test the Function

```bash
# Test locally first
supabase functions serve generate-invoice-pdf

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-invoice-pdf' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"invoice_id":"your-invoice-id-here"}'
```

### 3.5. Test in Production

```bash
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/generate-invoice-pdf' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"invoice_id":"your-invoice-id-here"}'
```

---

## ✅ Step 4: Verify Everything Works

### 4.1. Check Database Data

```sql
-- Check customers
SELECT COUNT(*), country 
FROM customers, jsonb_to_record(address) AS x(country text)
WHERE address IS NOT NULL
GROUP BY country;

-- Check invoices
SELECT 
  COUNT(*) as total_invoices,
  SUM(total_amount) as total_invoiced,
  SUM(amount_paid) as total_paid,
  SUM(amount_due) as total_outstanding
FROM invoices
WHERE invoice_number LIKE 'INV-%2025%';

-- Check payments
SELECT 
  provider,
  COUNT(*) as count,
  SUM(amount) as total,
  currency
FROM payments
WHERE payment_number LIKE 'PAY-%2025%'
GROUP BY provider, currency;
```

### 4.2. Test Frontend

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Test Invoice List:**
   - Navigate to `/invoices`
   - Should see 5 invoices
   - All amounts in ZAR
   - Different statuses (paid, sent, overdue, viewed, draft)

3. **Test Invoice Detail:**
   - Click any invoice
   - Should see full details
   - Customer info should show South African addresses
   - Currency should be ZAR
   - VAT at 15%

4. **Test Payment List:**
   - Navigate to `/payments`
   - Should see 6 payments
   - Various providers (EFT, Yoco, SnapScan, etc.)
   - Currency: ZAR

5. **Test PDF Generation:**
   - Open any invoice
   - Click "Download PDF"
   - Should generate HTML/PDF
   - Opens in new tab
   - Can print to PDF using Ctrl+P

### 4.3. Test Customer List

- Navigate to `/customers`
- Should see 6 South African customers
- Addresses in different provinces
- Purchase statistics populated

---

## 🔒 Step 5: Security Verification

### Check RLS Policies:

```sql
-- Verify RLS is enabled on all tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('invoices', 'payments', 'customers', 'invoice_items');

-- All should show rowsecurity = true
```

### Test Business Isolation:

```sql
-- Create test: Try to access another business's data
-- This should return empty (RLS blocking)
SELECT * FROM invoices 
WHERE business_id != (
  SELECT business_id FROM business_users 
  WHERE user_id = auth.uid() 
  LIMIT 1
);
```

---

## 📊 Step 6: Performance Optimization

### Add Indexes (if not already present):

```sql
-- Invoice performance
CREATE INDEX IF NOT EXISTS idx_invoices_business_status 
  ON invoices(business_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_customer 
  ON invoices(customer_id);

CREATE INDEX IF NOT EXISTS idx_invoices_due_date 
  ON invoices(due_date) 
  WHERE status IN ('sent', 'viewed', 'overdue');

-- Payment performance
CREATE INDEX IF NOT EXISTS idx_payments_business_status 
  ON payments(business_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_invoice 
  ON payments(invoice_id);

-- Customer performance
CREATE INDEX IF NOT EXISTS idx_customers_business_active 
  ON customers(business_id, is_active);
```

---

## 🎯 Step 7: Production Environment Variables

### Update `.env` file:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Application
VITE_SITE_URL=https://yourdomain.com
VITE_APP_NAME=BizPilot

# Features
VITE_ENABLE_PDF_GENERATION=true
VITE_DEFAULT_CURRENCY=ZAR
VITE_DEFAULT_TAX_RATE=15
VITE_DEFAULT_COUNTRY=ZA
```

---

## 🚀 Step 8: Deploy Frontend

### Using Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Using Netlify:

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Manual Build:

```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Deploy dist/ folder to your hosting
```

---

## ✅ Post-Deployment Checklist

- [ ] All 6 customers visible in `/customers`
- [ ] All 5 invoices visible in `/invoices`
- [ ] All 6 payments visible in `/payments`
- [ ] Currency shows as ZAR everywhere
- [ ] VAT calculated at 15%
- [ ] PDF generation works
- [ ] Search and filters work
- [ ] Statistics cards show correct data
- [ ] No console errors
- [ ] Mobile responsive works
- [ ] All links work correctly
- [ ] Role permissions working
- [ ] RLS policies active

---

## 🐛 Troubleshooting

### Issue: "No invoices found"

**Solution:**
```bash
# Check if migration ran
supabase db diff

# Re-run migration
supabase db push --file supabase/migrations/20251028000000_seed_south_african_data.sql
```

### Issue: "PDF generation failed"

**Check:**
1. Storage bucket `documents` exists
2. Edge Function deployed
3. Browser console for errors

**Test Edge Function:**
```bash
supabase functions logs generate-invoice-pdf
```

### Issue: "Permission denied"

**Check RLS:**
```sql
-- Verify business_users entry exists
SELECT * FROM business_users WHERE user_id = auth.uid();

-- Check invoice permissions
SELECT * FROM invoices 
WHERE business_id IN (
  SELECT business_id FROM business_users 
  WHERE user_id = auth.uid()
);
```

### Issue: "Currency not showing ZAR"

**Check:**
1. Database has `currency = 'ZAR'` in invoices/payments
2. Frontend formatCurrency utility works
3. No hardcoded USD values

---

## 📚 Additional Resources

### South African Banking Codes:
- **Standard Bank**: 051001
- **FNB**: 250655
- **Nedbank**: 198765
- **ABSA**: 632005
- **Capitec**: 470010

### Payment Providers:
- **PayFast**: https://www.payfast.co.za/developers/
- **Yoco**: https://developer.yoco.com/
- **SnapScan**: QR code based
- **Ozow**: https://ozow.com/developers/

### Compliance:
- **SARS**: https://www.sars.gov.za/
- **VAT**: 15% standard rate
- **POPIA**: Data protection compliance

---

## 🎉 Success Metrics

After deployment, you should have:

✅ **Production-Ready Data:**
- 6 realistic South African customers
- 5 sample invoices (R 477K total)
- 6 payments across different providers
- All in ZAR currency with 15% VAT

✅ **Working Features:**
- Invoice creation and management
- Payment recording
- Customer management
- PDF generation (via browser print)
- Search and filters
- Statistics dashboards

✅ **Security:**
- RLS policies active
- Business data isolation
- Role-based permissions
- Secure Edge Functions

---

**Status:** ✅ Ready for Production  
**Next Steps:** Monitor usage, collect feedback, iterate  
**Support:** Check logs in Supabase Dashboard

🇿🇦 **Built for South Africa. Powered by BizPilot.** 🚀
