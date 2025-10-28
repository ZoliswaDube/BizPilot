// usePayments Hook
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { useBusiness } from './useBusiness'
import { paymentService } from '../services/paymentService'
import type {
  Payment,
  CreatePaymentRequest,
  RefundPaymentRequest,
  PaymentStats,
  PaymentFilters,
  UsePaymentsReturn
} from '../types/payments'

export function usePayments(filters?: PaymentFilters): UsePaymentsReturn {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuthStore()
  const { business } = useBusiness()

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    if (!business?.id) return

    try {
      setLoading(true)
      setError(null)

      const data = await paymentService.getPayments(business.id, {
        status: filters?.status,
        date_from: filters?.date_from,
        date_to: filters?.date_to,
        limit: 100
      })

      setPayments(data)
    } catch (err) {
      console.error('Error fetching payments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }, [business?.id, filters])

  // Create payment
  const createPayment = useCallback(async (data: CreatePaymentRequest): Promise<Payment> => {
    if (!business?.id || !user?.id) {
      throw new Error('Business and user context required')
    }

    try {
      const payment = await paymentService.createPaymentRecord(business.id, data)
      
      if (!payment) {
        throw new Error('Failed to create payment')
      }

      // Refresh payments list
      await fetchPayments()

      return payment
    } catch (err) {
      console.error('Error creating payment:', err)
      throw err
    }
  }, [business?.id, user?.id, fetchPayments])

  // Refund payment
  const refundPayment = useCallback(async (request: RefundPaymentRequest): Promise<Payment> => {
    try {
      const payment = await paymentService.refundPayment(request)
      
      if (!payment) {
        throw new Error('Failed to refund payment')
      }

      // Refresh payments list
      await fetchPayments()

      return payment
    } catch (err) {
      console.error('Error refunding payment:', err)
      throw err
    }
  }, [fetchPayments])

  // Get payment statistics
  const getPaymentStats = useCallback(async (): Promise<PaymentStats> => {
    if (!business?.id) {
      throw new Error('Business context required')
    }

    try {
      const allPayments = await paymentService.getPayments(business.id, {})
      
      const total_revenue = allPayments
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount - p.refund_amount, 0)
      
      const total_payments = allPayments.length
      const successful_payments = allPayments.filter(p => p.status === 'succeeded').length
      const failed_payments = allPayments.filter(p => p.status === 'failed').length
      const refunded_amount = allPayments.reduce((sum, p) => sum + p.refund_amount, 0)
      const pending_amount = allPayments
        .filter(p => ['pending', 'processing'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0)
      
      const average_transaction = successful_payments > 0
        ? total_revenue / successful_payments
        : 0

      return {
        total_revenue,
        total_payments,
        successful_payments,
        failed_payments,
        refunded_amount,
        pending_amount,
        average_transaction
      }
    } catch (err) {
      console.error('Error getting payment stats:', err)
      throw err
    }
  }, [business?.id])

  // Refresh payments
  const refreshPayments = useCallback(async (): Promise<void> => {
    await fetchPayments()
  }, [fetchPayments])

  // Load payments on mount and when dependencies change
  useEffect(() => {
    if (business?.id) {
      fetchPayments()
    }
  }, [business?.id, fetchPayments])

  return {
    payments,
    loading,
    error,
    createPayment,
    refundPayment,
    getPaymentStats,
    refreshPayments
  } as const
}
