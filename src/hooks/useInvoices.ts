// useInvoices Hook
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { useBusiness } from './useBusiness'
import { invoiceService } from '../services/invoiceService'
import type {
  Invoice,
  InvoiceWithItems,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceStats,
  InvoiceFilters,
  UseInvoicesReturn
} from '../types/payments'

export function useInvoices(filters?: InvoiceFilters): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<InvoiceWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuthStore()
  const { business } = useBusiness()

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    if (!business?.id) return

    try {
      setLoading(true)
      setError(null)

      const data = await invoiceService.getInvoices(business.id, {
        status: filters?.status,
        customer_id: filters?.customer_id,
        date_from: filters?.date_from,
        date_to: filters?.date_to,
        limit: 100
      })

      setInvoices(data)

      // Update overdue invoices
      await invoiceService.updateOverdueInvoices(business.id)
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }, [business?.id, filters])

  // Create invoice
  const createInvoice = useCallback(async (data: CreateInvoiceRequest): Promise<Invoice> => {
    if (!business?.id || !user?.id) {
      throw new Error('Business and user context required')
    }

    try {
      const invoice = await invoiceService.createInvoice(business.id, data)
      
      if (!invoice) {
        throw new Error('Failed to create invoice')
      }

      // Refresh invoices list
      await fetchInvoices()

      return invoice
    } catch (err) {
      console.error('Error creating invoice:', err)
      throw err
    }
  }, [business?.id, user?.id, fetchInvoices])

  // Update invoice
  const updateInvoice = useCallback(async (id: string, data: UpdateInvoiceRequest): Promise<Invoice> => {
    try {
      const invoice = await invoiceService.updateInvoice(id, data)
      
      if (!invoice) {
        throw new Error('Failed to update invoice')
      }

      // Refresh invoices list
      await fetchInvoices()

      return invoice
    } catch (err) {
      console.error('Error updating invoice:', err)
      throw err
    }
  }, [fetchInvoices])

  // Delete invoice
  const deleteInvoice = useCallback(async (id: string): Promise<void> => {
    try {
      const success = await invoiceService.deleteInvoice(id)
      
      if (!success) {
        throw new Error('Failed to delete invoice')
      }

      // Refresh invoices list
      await fetchInvoices()
    } catch (err) {
      console.error('Error deleting invoice:', err)
      throw err
    }
  }, [fetchInvoices])

  // Send invoice
  const sendInvoice = useCallback(async (id: string): Promise<void> => {
    try {
      const success = await invoiceService.sendInvoice(id, true) // Send with email
      
      if (!success) {
        throw new Error('Failed to send invoice')
      }

      // Refresh invoices list
      await fetchInvoices()
    } catch (err) {
      console.error('Error sending invoice:', err)
      throw err
    }
  }, [fetchInvoices])

  // Generate invoice PDF
  const generateInvoicePDF = useCallback(async (id: string): Promise<string> => {
    try {
      const pdfUrl = await invoiceService.generateInvoicePDF(id)
      
      if (!pdfUrl) {
        throw new Error('Failed to generate PDF')
      }

      return pdfUrl
    } catch (err) {
      console.error('Error generating PDF:', err)
      throw err
    }
  }, [])

  // Get invoice statistics
  const getInvoiceStats = useCallback(async (): Promise<InvoiceStats> => {
    if (!business?.id) {
      throw new Error('Business context required')
    }

    try {
      const stats = await invoiceService.getInvoiceStats(business.id)
      
      if (!stats) {
        throw new Error('Failed to get invoice stats')
      }

      return stats
    } catch (err) {
      console.error('Error getting invoice stats:', err)
      throw err
    }
  }, [business?.id])

  // Refresh invoices
  const refreshInvoices = useCallback(async (): Promise<void> => {
    await fetchInvoices()
  }, [fetchInvoices])

  // Load invoices on mount and when dependencies change
  useEffect(() => {
    if (business?.id) {
      fetchInvoices()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Note: fetchInvoices is intentionally not in deps to avoid infinite loop
    // The filter values are explicitly listed instead
  }, [business?.id, filters?.status, filters?.customer_id, filters?.date_from, filters?.date_to])

  return {
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    generateInvoicePDF,
    getInvoiceStats,
    refreshInvoices
  } as const
}
