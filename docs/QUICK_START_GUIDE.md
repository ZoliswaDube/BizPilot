# 🚀 BizPilot Payment & Invoicing - Quick Start Guide

## 📦 **STEP 1: Install Dependencies**

```bash
cd d:\Downloads\Personal_Projects\BizPilot
npm install
```

This will install:
- `@stripe/stripe-js` - Stripe payment integration
- `jspdf` & `jspdf-autotable` - PDF generation
- `stripe` - Stripe SDK

---

## 🗄️ **STEP 2: Apply Database Migration**

### Option A: Using Supabase CLI
```bash
supabase db push
```

### Option B: Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your BizPilot project
3. Go to **SQL Editor**
4. Open file: `supabase/migrations/20250727000000_payment_and_invoicing_system.sql`
5. Copy and paste the entire SQL
6. Click **Run**

---

## 🔑 **STEP 3: Configure Environment Variables**

Create or update `.env` file:

```env
# Existing variables
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# New: Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here

# For Supabase Edge Functions (server-side)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
```

### Get Stripe Keys:
1. Sign up at [stripe.com](https://stripe.com)
2. Go to **Developers** → **API Keys**
3. Copy **Publishable key** (starts with `pk_test_`)
4. Copy **Secret key** (starts with `sk_test_`)

---

## ⚡ **STEP 4: Create Supabase Edge Functions**

### A. Create Payment Intent Function

```bash
supabase functions new create-payment-intent
```

**File:** `supabase/functions/create-payment-intent/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  try {
    const { amount, currency, metadata } = await req.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'usd',
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return new Response(
      JSON.stringify(paymentIntent),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### B. Create Refund Function

```bash
supabase functions new refund-payment
```

**File:** `supabase/functions/refund-payment/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  try {
    const { payment_intent_id, amount, reason } = await req.json()

    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      amount: amount,
      reason: reason || 'requested_by_customer',
    })

    return new Response(
      JSON.stringify(refund),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### Deploy Edge Functions

```bash
supabase functions deploy create-payment-intent --no-verify-jwt
supabase functions deploy refund-payment --no-verify-jwt
```

---

## 🧪 **STEP 5: Test the Implementation**

### A. Test Database Schema

```sql
-- Run in Supabase SQL Editor
SELECT * FROM payments LIMIT 1;
SELECT * FROM invoices LIMIT 1;
SELECT * FROM invoice_items LIMIT 1;
SELECT * FROM payment_methods LIMIT 1;
```

### B. Test in Your App

Create a test component:

```typescript
// src/components/test/PaymentTest.tsx
import { usePayments } from '../../hooks/usePayments'
import { useInvoices } from '../../hooks/useInvoices'

export function PaymentTest() {
  const { payments, loading: paymentsLoading } = usePayments()
  const { invoices, loading: invoicesLoading } = useInvoices()

  if (paymentsLoading || invoicesLoading) return <div>Loading...</div>

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Payment & Invoice System</h2>
      
      <div className="mb-4">
        <h3 className="text-xl font-semibold">Payments ({payments.length})</h3>
        <pre>{JSON.stringify(payments.slice(0, 2), null, 2)}</pre>
      </div>

      <div>
        <h3 className="text-xl font-semibold">Invoices ({invoices.length})</h3>
        <pre>{JSON.stringify(invoices.slice(0, 2), null, 2)}</pre>
      </div>
    </div>
  )
}
```

---

## 🎨 **STEP 6: Build UI Components** (Next Phase)

### Priority Components:
1. **PaymentForm** - Process payments
2. **InvoiceForm** - Create invoices
3. **InvoiceList** - View all invoices
4. **PaymentList** - View payment history

---

## 📝 **Usage Examples**

### Create an Invoice

```typescript
import { useInvoices } from './hooks/useInvoices'

function MyComponent() {
  const { createInvoice } = useInvoices()

  const handleCreateInvoice = async () => {
    const invoice = await createInvoice({
      customer_id: 'customer-uuid',
      issue_date: '2025-01-27',
      due_date: '2025-02-27',
      items: [
        {
          description: 'Web Development Services',
          quantity: 10,
          unit_price: 150.00,
          tax_percentage: 10
        },
        {
          description: 'Hosting (Annual)',
          quantity: 1,
          unit_price: 500.00,
          discount_percentage: 10
        }
      ],
      notes: 'Thank you for your business!',
      payment_instructions: 'Payment due within 30 days'
    })

    console.log('Invoice created:', invoice)
  }

  return (
    <button onClick={handleCreateInvoice}>
      Create Invoice
    </button>
  )
}
```

### Process a Payment

```typescript
import { usePayments } from './hooks/usePayments'

function PaymentComponent() {
  const { createPayment } = usePayments()

  const handlePayment = async () => {
    const payment = await createPayment({
      invoice_id: 'invoice-uuid',
      amount: 1650.00,
      currency: 'USD',
      provider: 'manual',
      description: 'Payment for Invoice #INV-BIZ-2025-0001'
    })

    console.log('Payment recorded:', payment)
  }

  return (
    <button onClick={handlePayment}>
      Record Payment
    </button>
  )
}
```

---

## 🐛 **Troubleshooting**

### Issue: "Cannot find module '@stripe/stripe-js'"
**Solution:** Run `npm install` to install dependencies

### Issue: "Table 'payments' does not exist"
**Solution:** Apply the database migration (Step 2)

### Issue: "STRIPE_SECRET_KEY is not defined"
**Solution:** Add Stripe keys to environment variables (Step 3)

### Issue: "Function 'create-payment-intent' not found"
**Solution:** Deploy Supabase edge functions (Step 4)

---

## 📚 **Next Steps**

1. ✅ Complete Steps 1-4 above
2. 🎨 Build UI components (see IMPLEMENTATION_PROGRESS.md)
3. 🧪 Test payment flow end-to-end
4. 📧 Set up email notifications
5. 📊 Add analytics dashboard

---

## 💡 **Tips**

- Use Stripe **test mode** during development
- Test with Stripe test cards: `4242 4242 4242 4242`
- Monitor Supabase logs for debugging
- Check browser console for errors
- Use React DevTools to inspect hook state

---

## 🔗 **Useful Links**

- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Supabase Functions Guide](https://supabase.com/docs/guides/functions)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [BizPilot Implementation Progress](./IMPLEMENTATION_PROGRESS.md)

---

**Ready to build amazing payment features!** 🚀
