import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { useBusiness } from './useBusiness'
import type { Customer } from '../types/orders'

interface CreateCustomerRequest {
  name: string
  email?: string
  phone?: string
  company?: string
  address?: any
  notes?: string
  tags?: string[]
  preferred_contact_method?: 'email' | 'phone' | 'sms'
}

interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

interface UseCustomersReturn {
  customers: Customer[]
  loading: boolean
  error: string | null
  createCustomer: (customerData: CreateCustomerRequest) => Promise<Customer>
  updateCustomer: (customerId: string, updates: UpdateCustomerRequest) => Promise<Customer>
  deleteCustomer: (customerId: string) => Promise<void>
  refreshCustomers: () => Promise<void>
}

export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuthStore()
  const { business } = useBusiness()

  // Fetch customers using MCP server
  const fetchCustomers = useCallback(async () => {
    if (!business?.id) return

    try {
      setLoading(true)
      setError(null)

      const result = await (window as any).mcpClient?.execute_sql({
        query: `
          SELECT 
            c.*,
            COUNT(o.id) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_spent,
            COALESCE(AVG(o.total_amount), 0) as average_order_value,
            MAX(o.order_date) as last_order_date
          FROM customers c
          LEFT JOIN orders o ON c.id = o.customer_id
          WHERE c.business_id = $1 AND c.is_active = true
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `,
        params: [business.id]
      })

      if (result?.error) {
        throw new Error(result.error.message || 'Failed to fetch customers')
      }

      setCustomers(result?.data || [])
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }, [business?.id])

  // Create new customer
  const createCustomer = useCallback(async (customerData: CreateCustomerRequest): Promise<Customer> => {
    if (!business?.id || !user?.id) {
      throw new Error('Business and user context required')
    }

    try {
      const result = await (window as any).mcpClient?.execute_sql({
        query: `
          INSERT INTO customers (
            business_id, name, email, phone, company, address, notes, 
            tags, preferred_contact_method, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          ) RETURNING *
        `,
        params: [
          business.id,
          customerData.name,
          customerData.email || null,
          customerData.phone || null,
          customerData.company || null,
          customerData.address ? JSON.stringify(customerData.address) : null,
          customerData.notes || null,
          customerData.tags || [],
          customerData.preferred_contact_method || 'email',
          user.id
        ]
      })

      if (result?.error) {
        throw new Error(result.error.message || 'Failed to create customer')
      }

      const newCustomer = result.data[0]
      
      // Refresh customers list
      await fetchCustomers()

      return newCustomer
    } catch (err) {
      console.error('Error creating customer:', err)
      throw err
    }
  }, [business?.id, user?.id, fetchCustomers])

  // Update customer
  const updateCustomer = useCallback(async (customerId: string, updates: UpdateCustomerRequest): Promise<Customer> => {
    if (!business?.id) {
      throw new Error('Business context required')
    }

    try {
      const updateFields: string[] = []
      const params: any[] = []
      let paramIndex = 1

      // Build dynamic update query
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`)
          params.push(typeof value === 'object' ? JSON.stringify(value) : value)
          paramIndex++
        }
      })

      if (updateFields.length === 0) {
        throw new Error('No updates provided')
      }

      updateFields.push(`updated_at = NOW()`)
      params.push(customerId, business.id)

      const result = await (window as any).mcpClient?.execute_sql({
        query: `
          UPDATE customers 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex} AND business_id = $${paramIndex + 1}
          RETURNING *
        `,
        params
      })

      if (result?.error) {
        throw new Error(result.error.message || 'Failed to update customer')
      }

      const updatedCustomer = result.data[0]
      
      // Refresh customers list
      await fetchCustomers()

      return updatedCustomer
    } catch (err) {
      console.error('Error updating customer:', err)
      throw err
    }
  }, [business?.id, fetchCustomers])

  // Delete customer
  const deleteCustomer = useCallback(async (customerId: string): Promise<void> => {
    if (!business?.id) {
      throw new Error('Business context required')
    }

    try {
      // Soft delete by setting is_active to false
      const result = await (window as any).mcpClient?.execute_sql({
        query: `
          UPDATE customers 
          SET is_active = false, updated_at = NOW()
          WHERE id = $1 AND business_id = $2
        `,
        params: [customerId, business.id]
      })

      if (result?.error) {
        throw new Error(result.error.message || 'Failed to delete customer')
      }

      // Refresh customers list
      await fetchCustomers()
    } catch (err) {
      console.error('Error deleting customer:', err)
      throw err
    }
  }, [business?.id, fetchCustomers])

  // Refresh customers
  const refreshCustomers = useCallback(async (): Promise<void> => {
    await fetchCustomers()
  }, [fetchCustomers])

  // Load customers on mount and when dependencies change
  useEffect(() => {
    if (business?.id) {
      fetchCustomers()
    }
  }, [fetchCustomers])

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers
  } as const
}