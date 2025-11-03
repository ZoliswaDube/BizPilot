// Payment and Invoicing Types

// Database types (manual definitions until DB types are regenerated)
export interface Payment {
  id: string
  business_id: string
  order_id?: string | null
  invoice_id?: string | null
  payment_method_id?: string | null
  payment_number: string
  amount: number
  currency: string
  status: PaymentStatus
  provider?: string | null
  provider_payment_id?: string | null
  provider_customer_id?: string | null
  description?: string | null
  metadata?: Record<string, any>
  failure_reason?: string | null
  refund_amount: number
  refunded_at?: string | null
  paid_at?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface PaymentInsert extends Omit<Payment, 'id' | 'created_at' | 'updated_at'> {
  id?: string
  created_at?: string
  updated_at?: string
}

export interface PaymentUpdate extends Partial<Omit<Payment, 'id' | 'created_at' | 'business_id'>> {}

export interface Invoice {
  id: string
  business_id: string
  customer_id?: string | null
  order_id?: string | null
  invoice_number: string
  status: InvoiceStatus
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  amount_paid: number
  amount_due: number
  issue_date: string
  due_date: string
  paid_date?: string | null
  notes?: string | null
  terms?: string | null
  payment_instructions?: string | null
  billing_address?: Record<string, any> | null
  shipping_address?: Record<string, any> | null
  metadata?: Record<string, any>
  pdf_url?: string | null
  sent_at?: string | null
  viewed_at?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface InvoiceInsert extends Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'subtotal' | 'tax_amount' | 'discount_amount' | 'total_amount' | 'amount_paid' | 'amount_due'> {
  id?: string
  created_at?: string
  updated_at?: string
}

export interface InvoiceUpdate extends Partial<Omit<Invoice, 'id' | 'created_at' | 'business_id' | 'invoice_number'>> {}

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_id?: string | null
  description: string
  quantity: number
  unit_price: number
  discount_percentage: number
  tax_percentage: number
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  metadata?: Record<string, any>
  created_at: string
}

export interface InvoiceItemInsert extends Omit<InvoiceItem, 'id' | 'created_at' | 'subtotal' | 'discount_amount' | 'tax_amount' | 'total_amount'> {
  id?: string
  created_at?: string
}

export interface PaymentMethod {
  id: string
  business_id: string
  type: PaymentMethodType
  provider?: string | null
  provider_payment_method_id?: string | null
  last4?: string | null
  brand?: string | null
  bank_name?: string | null // For EFT: FNB, Nedbank, Standard Bank, etc.
  account_number?: string | null // Masked account number
  is_default: boolean
  is_active: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface PaymentMethodInsert extends Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'> {
  id?: string
  created_at?: string
  updated_at?: string
}

export interface PaymentTransaction {
  id: string
  payment_id: string
  type: TransactionType
  amount: number
  status: 'pending' | 'succeeded' | 'failed'
  provider_transaction_id?: string | null
  provider_response?: Record<string, any> | null
  error_code?: string | null
  error_message?: string | null
  created_at: string
  created_by?: string | null
}

// Enums
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
export type PaymentMethodType = 'card' | 'eft' | 'bank_transfer' | 'cash' | 'mobile_payment' | 'other'
export type PaymentProvider = 'payfast' | 'yoco' | 'ozow' | 'snapscan' | 'zapper' | 'stripe' | 'manual' | 'eft'
export type TransactionType = 'authorization' | 'capture' | 'refund' | 'void' | 'chargeback'

// South African specific types
export type SouthAfricanBank = 'FNB' | 'Standard Bank' | 'Nedbank' | 'ABSA' | 'Capitec' | 'Discovery Bank' | 'TymeBank' | 'African Bank'
export type BankAccountType = 'Current' | 'Savings' | 'Transmission'

// Extended types with relationships
export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[]
  customer?: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string | {
      street?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
  }
}

export interface PaymentWithDetails extends Payment {
  invoice?: Invoice
  payment_method?: PaymentMethod
  transactions?: PaymentTransaction[]
}

// Request types
export interface CreatePaymentRequest {
  order_id?: string
  invoice_id?: string
  payment_method_id?: string
  amount: number
  currency?: string
  provider?: PaymentProvider
  description?: string
  metadata?: Record<string, any>
}

export interface CreateInvoiceRequest {
  customer_id?: string
  order_id?: string
  issue_date: string
  due_date: string
  notes?: string
  terms?: string
  payment_instructions?: string
  billing_address?: Address
  shipping_address?: Address
  items: CreateInvoiceItemRequest[]
}

export interface CreateInvoiceItemRequest {
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  discount_percentage?: number
  tax_percentage?: number
}

export interface UpdateInvoiceRequest {
  status?: InvoiceStatus
  notes?: string
  terms?: string
  payment_instructions?: string
  due_date?: string
  billing_address?: Address
  shipping_address?: Address
}

export interface ProcessPaymentRequest {
  payment_method_id: string
  amount: number
  currency?: string
  description?: string
  save_payment_method?: boolean
}

export interface RefundPaymentRequest {
  payment_id: string
  amount?: number // Partial refund if specified
  reason?: string
}

// Address type
export interface Address {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  line1?: string
  line2?: string
}

// Stripe specific types
export interface StripePaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  client_secret: string
  customer?: string
  payment_method?: string
  metadata?: Record<string, any>
}

export interface StripeCustomer {
  id: string
  email: string
  name?: string
  metadata?: Record<string, any>
}

// Payment statistics
export interface PaymentStats {
  total_revenue: number
  total_payments: number
  successful_payments: number
  failed_payments: number
  refunded_amount: number
  pending_amount: number
  average_transaction: number
}

// Invoice statistics
export interface InvoiceStats {
  total_invoices: number
  paid_invoices: number
  unpaid_invoices: number
  overdue_invoices: number
  total_billed: number
  total_paid: number
  total_outstanding: number
  average_invoice_value: number
}

// Hook return types
export interface UsePaymentsReturn {
  payments: Payment[]
  loading: boolean
  error: string | null
  createPayment: (data: CreatePaymentRequest) => Promise<Payment>
  refundPayment: (request: RefundPaymentRequest) => Promise<Payment>
  getPaymentStats: () => Promise<PaymentStats>
  refreshPayments: () => Promise<void>
}

export interface UseInvoicesReturn {
  invoices: InvoiceWithItems[]
  loading: boolean
  error: string | null
  createInvoice: (data: CreateInvoiceRequest) => Promise<Invoice>
  updateInvoice: (id: string, data: UpdateInvoiceRequest) => Promise<Invoice>
  deleteInvoice: (id: string) => Promise<void>
  sendInvoice: (id: string) => Promise<void>
  generateInvoicePDF: (id: string) => Promise<string> // Returns PDF URL
  getInvoiceStats: () => Promise<InvoiceStats>
  refreshInvoices: () => Promise<void>
}

// PDF Generation options
export interface InvoicePDFOptions {
  logo_url?: string
  primary_color?: string
  show_payment_instructions?: boolean
  show_terms?: boolean
  custom_footer?: string
}

// Email options
export interface InvoiceEmailOptions {
  to: string
  cc?: string[]
  subject?: string
  message?: string
  attach_pdf?: boolean
}

// Payment form data
export interface PaymentFormData {
  amount: number
  payment_method_id?: string
  card_number?: string
  card_exp_month?: number
  card_exp_year?: number
  card_cvc?: string
  cardholder_name?: string
  billing_address?: Address
  save_card?: boolean
}

// Invoice filters
export interface InvoiceFilters {
  status?: InvoiceStatus[]
  customer_id?: string
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  search?: string
  overdue_only?: boolean
}

// Payment filters
export interface PaymentFilters {
  status?: PaymentStatus[]
  provider?: PaymentProvider[]
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  search?: string
}
