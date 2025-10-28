// Invoice Service - Invoice generation and management
import { supabase } from '../lib/supabase'
import type {
  Invoice,
  InvoiceInsert,
  InvoiceWithItems,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceItem,
  InvoiceItemInsert
} from '../types/payments'

class InvoiceService {
  /**
   * Create a new invoice with items
   */
  async createInvoice(
    businessId: string,
    request: CreateInvoiceRequest
  ): Promise<Invoice | null> {
    try {
      // Generate invoice number
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc('generate_invoice_number', { business_id_param: businessId })

      if (numberError) throw numberError
      if (!invoiceNumber) throw new Error('Failed to generate invoice number')

      // Calculate due date if not provided
      const dueDate = request.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Create invoice
      const invoiceData: InvoiceInsert = {
        business_id: businessId,
        customer_id: request.customer_id,
        order_id: request.order_id,
        invoice_number: invoiceNumber,
        status: 'draft',
        issue_date: request.issue_date,
        due_date: dueDate,
        notes: request.notes,
        terms: request.terms,
        payment_instructions: request.payment_instructions,
        billing_address: request.billing_address,
        shipping_address: request.shipping_address
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice items
      for (const item of request.items) {
        const itemData: InvoiceItemInsert = {
          invoice_id: invoice.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage || 0,
          tax_percentage: item.tax_percentage || 0
        }

        const { error: itemError } = await supabase
          .from('invoice_items')
          .insert(itemData)

        if (itemError) throw itemError
      }

      // Fetch complete invoice with items
      return await this.getInvoiceById(invoice.id)
    } catch (error) {
      console.error('Error creating invoice:', error)
      return null
    }
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(
    invoiceId: string,
    updates: UpdateInvoiceRequest
  ): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating invoice:', error)
      return null
    }
  }

  /**
   * Get invoice by ID with items
   */
  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*),
          customer:customers(id, name, email, phone)
        `)
        .eq('id', invoiceId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching invoice:', error)
      return null
    }
  }

  /**
   * Get invoices for a business
   */
  async getInvoices(businessId: string, filters?: {
    status?: string[]
    customer_id?: string
    date_from?: string
    date_to?: string
    limit?: number
  }): Promise<InvoiceWithItems[]> {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*),
          customer:customers(id, name, email, phone)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
      }

      if (filters?.date_from) {
        query = query.gte('issue_date', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('issue_date', filters.date_to)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching invoices:', error)
      return []
    }
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      // Can only delete draft invoices
      const { data: invoice } = await supabase
        .from('invoices')
        .select('status')
        .eq('id', invoiceId)
        .single()

      if (!invoice) throw new Error('Invoice not found')
      if (invoice.status !== 'draft') {
        throw new Error('Can only delete draft invoices')
      }

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting invoice:', error)
      return false
    }
  }

  /**
   * Send invoice (mark as sent and optionally send email)
   */
  async sendInvoice(invoiceId: string, sendEmail: boolean = false): Promise<boolean> {
    try {
      // Update invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)

      if (updateError) throw updateError

      // Optionally send email (implement email service separately)
      if (sendEmail) {
        await this.emailInvoice(invoiceId)
      }

      return true
    } catch (error) {
      console.error('Error sending invoice:', error)
      return false
    }
  }

  /**
   * Email invoice to customer
   */
  private async emailInvoice(invoiceId: string): Promise<boolean> {
    try {
      // Get invoice with customer details
      const { data: invoice } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(email, name)
        `)
        .eq('id', invoiceId)
        .single()

      if (!invoice || !invoice.customer?.email) {
        throw new Error('Customer email not found')
      }

      // Call email service (to be implemented)
      // This would integrate with SendGrid, Resend, or similar
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoice_id: invoiceId,
          to_email: invoice.customer.email,
          customer_name: invoice.customer.name
        }
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error emailing invoice:', error)
      return false
    }
  }

  /**
   * Mark invoice as viewed (when customer opens it)
   */
  async markInvoiceViewed(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'viewed',
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .eq('status', 'sent') // Only update if currently 'sent'

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error marking invoice as viewed:', error)
      return false
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(businessId: string, dateFrom?: string, dateTo?: string) {
    try {
      let query = supabase
        .from('invoices')
        .select('status, total_amount, amount_paid, amount_due')
        .eq('business_id', businessId)

      if (dateFrom) {
        query = query.gte('issue_date', dateFrom)
      }

      if (dateTo) {
        query = query.lte('issue_date', dateTo)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = {
        total_invoices: data?.length || 0,
        paid_invoices: data?.filter(i => i.status === 'paid').length || 0,
        unpaid_invoices: data?.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).length || 0,
        overdue_invoices: data?.filter(i => i.status === 'overdue').length || 0,
        total_billed: data?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0,
        total_paid: data?.reduce((sum, i) => sum + (i.amount_paid || 0), 0) || 0,
        total_outstanding: data?.reduce((sum, i) => sum + (i.amount_due || 0), 0) || 0,
        average_invoice_value: data?.length ? 
          (data.reduce((sum, i) => sum + (i.total_amount || 0), 0) / data.length) : 0
      }

      return stats
    } catch (error) {
      console.error('Error fetching invoice stats:', error)
      return null
    }
  }

  /**
   * Check and update overdue invoices
   */
  async updateOverdueInvoices(businessId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('business_id', businessId)
        .in('status', ['sent', 'viewed'])
        .lt('due_date', today)
        .select()

      if (error) throw error
      return data?.length || 0
    } catch (error) {
      console.error('Error updating overdue invoices:', error)
      return 0
    }
  }

  /**
   * Generate invoice PDF (placeholder - implement with jsPDF)
   */
  async generateInvoicePDF(invoiceId: string): Promise<string | null> {
    try {
      // This would use jsPDF or similar to generate PDF
      // For now, return a placeholder URL
      
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

  /**
   * Add items to existing invoice
   */
  async addInvoiceItems(invoiceId: string, items: InvoiceItemInsert[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoice_items')
        .insert(items.map(item => ({
          ...item,
          invoice_id: invoiceId
        })))

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error adding invoice items:', error)
      return false
    }
  }

  /**
   * Remove item from invoice
   */
  async removeInvoiceItem(itemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoice_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error removing invoice item:', error)
      return false
    }
  }
}

export const invoiceService = new InvoiceService()
