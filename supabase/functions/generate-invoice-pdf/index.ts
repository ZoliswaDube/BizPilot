import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Currency configuration - TODO: Get from invoice/business settings
interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  decimalPlaces: number;
}

const currencyConfigs: Record<string, CurrencyConfig> = {
  ZAR: { code: 'ZAR', symbol: 'R', locale: 'en-ZA', decimalPlaces: 2 },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', decimalPlaces: 2 },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', decimalPlaces: 2 },
}

// Simple PDF generation using HTML/CSS
function generatePDFHTML(invoice: any, currencyCode: string = 'ZAR'): string {
  const config = currencyConfigs[currencyCode] || currencyConfigs.ZAR
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
    }).format(amount)
  }
  
  const formatDate = (date: string) => new Date(date).toLocaleDateString(config.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
      color: #333;
      line-height: 1.6;
    }
    .header { 
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .logo-section h1 { 
      color: #2563eb;
      font-size: 28px;
      margin-bottom: 8px;
    }
    .logo-section p { 
      color: #666;
      font-size: 14px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h2 {
      font-size: 36px;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .section {
      flex: 1;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      margin-right: 20px;
    }
    .section:last-child { margin-right: 0; }
    .section h3 {
      color: #2563eb;
      font-size: 14px;
      text-transform: uppercase;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }
    .section p {
      margin-bottom: 6px;
      font-size: 14px;
    }
    .section strong { color: #1f2937; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    thead {
      background: #2563eb;
      color: white;
    }
    th {
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: #f9fafb; }
    .text-right { text-align: right; }
    .totals {
      float: right;
      width: 350px;
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .totals-row.total {
      border-top: 2px solid #2563eb;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
    }
    .notes {
      clear: both;
      margin-top: 40px;
      padding: 20px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
    }
    .notes h4 {
      color: #92400e;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .notes p {
      color: #78350f;
      font-size: 13px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    .payment-box {
      background: #dbeafe;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
      border: 2px solid #2563eb;
    }
    .payment-box h4 {
      color: #1e40af;
      margin-bottom: 12px;
      font-size: 16px;
    }
    .payment-box p {
      color: #1e3a8a;
      font-size: 13px;
      margin-bottom: 6px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-sent { background: #dbeafe; color: #1e40af; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    .status-draft { background: #f3f4f6; color: #374151; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <h1>${invoice.business.name || 'Your Business'}</h1>
      <p>${invoice.business.email || ''}</p>
      <p>${invoice.business.phone || ''}</p>
      <p>${invoice.business.address ? (typeof invoice.business.address === 'string' ? invoice.business.address : `${invoice.business.address.city}, ${invoice.business.address.country}`) : ''}</p>
    </div>
    <div class="invoice-title">
      <h2>TAX INVOICE</h2>
      <p><strong>${invoice.invoice_number}</strong></p>
      <p><span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
    </div>
  </div>

  <div class="invoice-details">
    <div class="section">
      <h3>Bill To</h3>
      <p><strong>${invoice.customer?.name || 'N/A'}</strong></p>
      ${invoice.customer?.company ? `<p>${invoice.customer.company}</p>` : ''}
      ${invoice.customer?.email ? `<p>${invoice.customer.email}</p>` : ''}
      ${invoice.customer?.phone ? `<p>${invoice.customer.phone}</p>` : ''}
      ${invoice.customer?.address ? `<p>${typeof invoice.customer.address === 'string' ? invoice.customer.address : `${invoice.customer.address.city}, ${invoice.customer.address.state}`}</p>` : ''}
    </div>
    <div class="section">
      <h3>Invoice Details</h3>
      <p><strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}</p>
      <p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
      ${invoice.paid_date ? `<p><strong>Paid Date:</strong> ${formatDate(invoice.paid_date)}</p>` : ''}
      <p><strong>Currency:</strong> ${config.code}</p>
      ${invoice.status === 'overdue' ? '<p style="color: #dc2626; font-weight: bold;">⚠️ OVERDUE</p>' : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Discount</th>
        <th class="text-right">VAT (15%)</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map((item: any) => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unit_price)}</td>
          <td class="text-right">${item.discount_percentage > 0 ? `${item.discount_percentage}%` : '-'}</td>
          <td class="text-right">${item.tax_percentage}%</td>
          <td class="text-right"><strong>${formatCurrency(item.total_amount)}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(invoice.subtotal)}</span>
    </div>
    ${invoice.discount_amount > 0 ? `
    <div class="totals-row">
      <span>Discount:</span>
      <span>-${formatCurrency(invoice.discount_amount)}</span>
    </div>` : ''}
    <div class="totals-row">
      <span>VAT (15%):</span>
      <span>${formatCurrency(invoice.tax_amount)}</span>
    </div>
    <div class="totals-row total">
      <span>TOTAL:</span>
      <span>${formatCurrency(invoice.total_amount)}</span>
    </div>
    ${invoice.amount_paid > 0 ? `
    <div class="totals-row" style="color: #059669;">
      <span>Amount Paid:</span>
      <span>-${formatCurrency(invoice.amount_paid)}</span>
    </div>
    <div class="totals-row" style="color: #dc2626; font-weight: bold;">
      <span>Amount Due:</span>
      <span>${formatCurrency(invoice.amount_due)}</span>
    </div>` : ''}
  </div>

  ${invoice.payment_instructions ? `
  <div class="payment-box">
    <h4>Payment Instructions</h4>
    <p>${invoice.payment_instructions.replace(/\n/g, '<br>')}</p>
  </div>` : ''}

  ${invoice.notes ? `
  <div class="notes">
    <h4>Notes</h4>
    <p>${invoice.notes}</p>
  </div>` : ''}

  ${invoice.terms ? `
  <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 4px;">
    <h4 style="color: #374151; margin-bottom: 8px; font-size: 13px;">Terms & Conditions</h4>
    <p style="color: #6b7280; font-size: 12px;">${invoice.terms}</p>
  </div>` : ''}

  <div class="footer">
    <p>This is a computer-generated tax invoice and is valid without a signature.</p>
    <p>Generated on ${new Date().toLocaleDateString('en-ZA')} at ${new Date().toLocaleTimeString('en-ZA')}</p>
    <p style="margin-top: 10px;">Thank you for your business!</p>
  </div>
</body>
</html>
  `
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Fetch invoice with all related data
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        customer:customers(id, name, email, phone, company, address),
        business:businesses(id, name, email, phone, address, logo_url)
      `)
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    // Get currency from business settings or default to ZAR
    const currencyCode = invoice.business?.currency || 'ZAR'

    // Generate HTML with dynamic currency
    const htmlContent = generatePDFHTML(invoice, currencyCode)

    // For now, we'll return the HTML
    // In production, you'd use a service like Puppeteer or a PDF API
    // This HTML can be printed to PDF from the browser using window.print()
    
    // Store HTML in Supabase Storage
    const fileName = `invoices/${invoice_id}_${Date.now()}.html`
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('documents')
      .upload(fileName, htmlContent, {
        contentType: 'text/html',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('documents')
      .getPublicUrl(fileName)

    // Update invoice with PDF URL
    await supabaseClient
      .from('invoices')
      .update({ pdf_url: publicUrl })
      .eq('id', invoice_id)

    return new Response(
      JSON.stringify({ 
        pdf_url: publicUrl,
        html_content: htmlContent,
        message: 'Open this URL in browser and use Ctrl+P to print/save as PDF'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
