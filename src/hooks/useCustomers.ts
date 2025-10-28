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

  // Fetch customers using Supabase
  const fetchCustomers = useCallback(async () => {
    if (!business?.id) return

    try {
      setLoading(true)
      setError(null)

      // Import supabase client
      const { supabase } = await import('../lib/supabase')

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (customersError) throw customersError

      // Fetch orders count and totals for each customer
      const customersWithStats = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, order_date')
            .eq('customer_id', customer.id)

          const total_orders = orders?.length || 0
          const total_spent = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
          const average_order_value = total_orders > 0 ? total_spent / total_orders : 0
          const last_order_date = orders?.[0]?.order_date || null

          return {
            ...customer,
            total_orders,
            total_spent,
            average_order_value,
            last_order_date,
            customer_since: customer.created_at
          }
        })
      )

      setCustomers(customersWithStats)
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
      const { supabase } = await import('../lib/supabase')

      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          business_id: business.id,
          name: customerData.name,
          email: customerData.email || null,
          phone: customerData.phone || null,
          company: customerData.company || null,
          address: customerData.address || null,
          notes: customerData.notes || null,
          tags: customerData.tags || [],
          preferred_contact_method: customerData.preferred_contact_method || 'email',
          created_by: user.id,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      if (!newCustomer) throw new Error('Failed to create customer')
      
      // Refresh customers list
      await fetchCustomers()

      return newCustomer as Customer
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
      const { supabase } = await import('../lib/supabase')

      if (Object.keys(updates).length === 0) {
        throw new Error('No updates provided')
      }

      const { data: updatedCustomer, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .eq('business_id', business.id)
        .select()
        .single()

      if (error) throw error
      if (!updatedCustomer) throw new Error('Failed to update customer')
      
      // Refresh customers list
      await fetchCustomers()

      return updatedCustomer as Customer
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
      const { supabase } = await import('../lib/supabase')

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('customers')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .eq('business_id', business.id)

      if (error) throw error

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