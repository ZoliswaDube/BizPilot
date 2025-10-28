# 📄 Invoice PDF Generation Setup Guide

**Status:** ⏳ Requires Supabase Edge Function Implementation  
**Priority:** HIGH  
**Estimated Time:** 2-3 hours

---

## 🎯 Current Status

### ✅ What's Implemented:
- Frontend PDF generation button (InvoiceList & InvoiceDetail)
- PDF generation service method (`invoiceService.generateInvoicePDF()`)
- Database field for PDF URL storage (`invoices.pdf_url`)
- Professional invoice display component ready for PDF conversion

### ❌ What's Missing:
- **Supabase Edge Function** for server-side PDF generation
- **PDF Library Integration** (jsPDF or Puppeteer)
- **PDF Storage** configuration (Supabase Storage bucket)
- **Error Handling** for PDF generation failures

---

## 🔧 Current Implementation

### Frontend Code (Already Done):

**InvoiceService** (`src/services/invoiceService.ts` line 369):
```typescript
async generateInvoicePDF(invoiceId: string): Promise<string | null> {
  try {
    // Call edge function to generate PDF
    const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
      body: { invoice_id: invoiceId }
    })

    if (error) throw error
    
    // Update invoice with PDF URL
    if (data?.pdf_url) {
      await supabase
        .from('invoices')
        .update({ pdf_url: data.pdf_url })
        .eq('id', invoiceId)
    }

    return data?.pdf_url || null
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return null
  }
}
```

**Current Behavior:**
- ✅ Button appears on invoice list and detail pages
- ❌ Clicking button fails because Edge Function doesn't exist
- ❌ Shows error: "Failed to generate PDF. Please try again."

---

## 📋 Implementation Steps

### Step 1: Create Supabase Edge Function

#### 1.1. Initialize Function
```bash
# In your Supabase project directory
cd supabase/functions
supabase functions new generate-invoice-pdf
```

#### 1.2. Install Dependencies
```bash
cd generate-invoice-pdf
npm init -y
npm install jspdf jspdf-autotable
# OR for higher quality PDFs:
npm install puppeteer-core chrome-aws-lambda
```

#### 1.3. Create Function Code

**Option A: Using jsPDF (Simpler, Lightweight)**

Create `supabase/functions/generate-invoice-pdf/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get invoice ID from request
    const { invoice_id } = await req.json()
    
    if (!invoice_id) {
      throw new Error('Invoice ID is required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Fetch invoice data
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        customer:customers(id, name, email, phone, address),
        business:businesses(id, name, email, phone, address, logo_url)
      `)
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    // Create PDF
    const doc = new jsPDF()
    
    // Add business logo (if exists)
    if (invoice.business.logo_url) {
      // Load and add image
      // doc.addImage(invoice.business.logo_url, 'PNG', 15, 10, 30, 30)
    }

    // Add business details
    doc.setFontSize(20)
    doc.text(invoice.business.name || 'Your Business', 15, 20)
    doc.setFontSize(10)
    doc.text(invoice.business.email || '', 15, 27)
    doc.text(invoice.business.phone || '', 15, 32)

    // Add "INVOICE" title
    doc.setFontSize(24)
    doc.text('INVOICE', 150, 20)
    
    // Add invoice details
    doc.setFontSize(10)
    doc.text(`Invoice #: ${invoice.invoice_number}`, 150, 30)
    doc.text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 150, 35)
    doc.text(`Due: ${new Date(invoice.due_date).toLocaleDateString()}`, 150, 40)

    // Add customer details
    doc.setFontSize(12)
    doc.text('Bill To:', 15, 50)
    doc.setFontSize(10)
    doc.text(invoice.customer?.name || 'N/A', 15, 57)
    if (invoice.customer?.email) doc.text(invoice.customer.email, 15, 62)
    if (invoice.customer?.phone) doc.text(invoice.customer.phone, 15, 67)

    // Add line items table
    const tableData = invoice.items.map((item: any) => [
      item.description,
      item.quantity.toString(),
      `R${item.unit_price.toFixed(2)}`,
      item.discount_percentage ? `${item.discount_percentage}%` : '-',
      `${item.tax_percentage}%`,
      `R${item.total_amount.toFixed(2)}`
    ])

    doc.autoTable({
      startY: 80,
      head: [['Description', 'Qty', 'Unit Price', 'Discount', 'Tax', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    })

    // Add totals
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.text(`Subtotal: R${invoice.subtotal.toFixed(2)}`, 150, finalY)
    doc.text(`Discount: R${invoice.discount_amount.toFixed(2)}`, 150, finalY + 5)
    doc.text(`Tax (VAT): R${invoice.tax_amount.toFixed(2)}`, 150, finalY + 10)
    doc.setFontSize(12)
    doc.text(`Total: R${invoice.total_amount.toFixed(2)}`, 150, finalY + 18)

    // Add notes if any
    if (invoice.notes) {
      doc.setFontSize(10)
      doc.text('Notes:', 15, finalY + 20)
      doc.text(invoice.notes, 15, finalY + 25, { maxWidth: 180 })
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })

    // Upload to Supabase Storage
    const fileName = `invoices/${invoice_id}_${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('documents')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('documents')
      .getPublicUrl(fileName)

    return new Response(
      JSON.stringify({ pdf_url: publicUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error generating PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
```

**Option B: Using Puppeteer (Higher Quality, More Resource Intensive)**

```typescript
// Similar structure but uses Puppeteer to render HTML to PDF
// Provides better control over styling and layout
// Requires more memory and processing power
```

---

### Step 2: Create Storage Bucket

#### 2.1. Via Supabase Dashboard:
1. Go to **Storage** → **Create a new bucket**
2. Name: `documents`
3. Public: ✅ Yes (for easy PDF access)
4. File size limit: 50MB
5. Allowed MIME types: `application/pdf`

#### 2.2. Via SQL:
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Set up RLS policies
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

---

### Step 3: Deploy Edge Function

```bash
# Deploy the function
supabase functions deploy generate-invoice-pdf

# Set environment variables (if needed)
supabase secrets set SOME_API_KEY=your_key_here

# Test the function
supabase functions invoke generate-invoice-pdf \
  --data '{"invoice_id":"your-invoice-id-here"}'
```

---

### Step 4: Test PDF Generation

#### 4.1. Frontend Testing:
1. Navigate to `/invoices`
2. Click "Download PDF" on any invoice
3. Verify:
   - PDF generates successfully
   - Opens in new tab
   - Has correct formatting
   - All data displays correctly

#### 4.2. Backend Testing:
```bash
# Test via curl
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-invoice-pdf' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"invoice_id":"invoice-uuid-here"}'
```

---

## 🎨 PDF Styling Options

### Basic Styling (jsPDF):
```typescript
// Custom fonts
doc.addFont('path/to/font.ttf', 'CustomFont', 'normal')
doc.setFont('CustomFont')

// Colors
doc.setTextColor(41, 128, 185) // RGB
doc.setFillColor(240, 240, 240) // Background

// Layout
doc.setLineWidth(0.5)
doc.line(15, 45, 195, 45) // Horizontal line
```

### Advanced Styling (HTML Template):
```typescript
// Create HTML template with CSS
const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #2980b9; color: white; padding: 20px; }
    .invoice-items { border-collapse: collapse; width: 100%; }
    .invoice-items td, .invoice-items th { 
      border: 1px solid #ddd; 
      padding: 8px; 
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${invoice.business.name}</h1>
  </div>
  <!-- More HTML -->
</body>
</html>
`

// Use Puppeteer to convert HTML to PDF
const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.setContent(htmlTemplate)
const pdf = await page.pdf({ format: 'A4' })
await browser.close()
```

---

## 🔒 Security Considerations

### RLS Policies:
```sql
-- Ensure users can only generate PDFs for their business invoices
CREATE POLICY "Users can generate PDFs for their business invoices"
ON invoices FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT business_id 
    FROM business_users 
    WHERE user_id = auth.uid()
  )
);
```

### Edge Function Auth:
```typescript
// Verify user is authorized
const { data: { user }, error } = await supabaseClient.auth.getUser()
if (error || !user) {
  throw new Error('Unauthorized')
}

// Check business ownership
const { data: businessUser } = await supabaseClient
  .from('business_users')
  .select('business_id')
  .eq('user_id', user.id)
  .single()

if (!businessUser) {
  throw new Error('No business association found')
}
```

---

## 📊 Cost Estimation

### Supabase Pricing:
- **Edge Functions**: $10/100K invocations (after free tier)
- **Storage**: $0.021/GB/month
- **Bandwidth**: $0.09/GB

### Estimated Monthly Cost (for 1000 invoices):
- Edge Function calls: ~$0.10
- PDF Storage (avg 100KB each): ~$0.002
- Bandwidth: ~$0.009
- **Total**: ~$0.11/month

---

## 🐛 Troubleshooting

### Common Issues:

**1. "Function not found" Error:**
```bash
# Redeploy function
supabase functions deploy generate-invoice-pdf --no-verify-jwt
```

**2. "Storage bucket not found":**
```bash
# Create bucket via SQL
psql -h db.your-project.supabase.co -U postgres -d postgres
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);
```

**3. "Out of memory" Error:**
- Reduce PDF quality
- Use jsPDF instead of Puppeteer
- Limit number of line items per PDF

**4. "CORS Error":**
- Ensure corsHeaders are included in all responses
- Check Edge Function CORS settings

---

## 📚 Alternative Solutions

### Option 1: Client-Side PDF Generation
**Pros:** No Edge Function needed, instant  
**Cons:** Limited styling, larger bundle size

```typescript
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const generatePDFClientSide = (invoice: Invoice) => {
  const doc = new jsPDF()
  // ... add content
  doc.save(`invoice-${invoice.invoice_number}.pdf`)
}
```

### Option 2: Third-Party Service
**Pros:** No maintenance, professional quality  
**Cons:** Ongoing cost, vendor lock-in

- **PDFMonkey**: $29/month for 1000 PDFs
- **DocRaptor**: $15/month for 500 PDFs
- **CloudConvert**: Pay per conversion

### Option 3: Scheduled PDF Generation
**Pros:** No wait time for users  
**Cons:** PDFs may be outdated

Generate PDFs overnight for all sent invoices.

---

## ✅ Success Criteria

- [ ] Edge Function deployed and running
- [ ] Storage bucket created and configured
- [ ] PDFs generate successfully
- [ ] PDFs have correct formatting
- [ ] PDFs display all invoice data
- [ ] PDF URLs are stored in database
- [ ] Download button works from UI
- [ ] Error handling implemented
- [ ] Performance is acceptable (<5s)
- [ ] Mobile-friendly PDF layout

---

## 📝 Next Steps

1. **Immediate:** Set up Supabase Storage bucket
2. **Next:** Create and deploy Edge Function
3. **Then:** Test PDF generation
4. **Finally:** Add error handling and retries

**Estimated Completion Time:** 2-3 hours for basic implementation

---

**Status:** 📋 Ready for Implementation  
**Last Updated:** October 28, 2025
