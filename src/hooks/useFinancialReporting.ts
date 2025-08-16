import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import { useBusiness } from './useBusiness'

export interface FinancialReport {
  period: {
    start_date: string
    end_date: string
  }
  revenue: {
    total_revenue: number
    gross_revenue: number
    tax_collected: number
    order_count: number
    average_order_value: number
    paid_revenue: number
    pending_revenue: number
  }
  expenses: {
    total_expenses: number
    expense_count: number
    average_expense: number
    tax_deductible_expenses: number
    by_category: Array<{
      category_name: string
      total_amount: number
      expense_count: number
    }>
  }
  profit_loss: {
    gross_profit: number
    net_profit: number
    profit_margin: number
  }
  cash_flow: {
    cash_in: number
    cash_out: number
    net_cash_flow: number
    outstanding_receivables: number
  }
  generated_at: string
}

export interface ExpenseCategory {
  id: string
  business_id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  business_id: string
  category_id?: string
  expense_number: string
  description: string
  amount: number
  expense_date: string
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'other'
  supplier_name?: string
  receipt_url?: string
  notes?: string
  is_tax_deductible: boolean
  created_at: string
  updated_at: string
  created_by?: string
  category?: ExpenseCategory
}

export interface CreateExpenseData {
  category_id?: string
  description: string
  amount: number
  expense_date?: string
  payment_method?: Expense['payment_method']
  supplier_name?: string
  receipt_url?: string
  notes?: string
  is_tax_deductible?: boolean
}

export function useFinancialReporting() {
  const { user } = useAuthStore()
  const { business } = useBusiness()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load expense categories
  const loadExpenseCategories = useCallback(async () => {
    if (!business?.id) return

    try {
      const { data, error: queryError } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('name')

      if (queryError) throw queryError

      setExpenseCategories(data || [])
    } catch (err) {
      console.error('Error loading expense categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to load expense categories')
    }
  }, [business?.id])

  // Load expenses
  const loadExpenses = useCallback(async (startDate?: string, endDate?: string) => {
    if (!business?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(*)
        `)
        .eq('business_id', business.id)
        .order('expense_date', { ascending: false })

      if (startDate) {
        query = query.gte('expense_date', startDate)
      }

      if (endDate) {
        query = query.lte('expense_date', endDate)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      setExpenses(data || [])
    } catch (err) {
      console.error('Error loading expenses:', err)
      setError(err instanceof Error ? err.message : 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [business?.id])

  // Create expense
  const createExpense = async (expenseData: CreateExpenseData): Promise<Expense | null> => {
    if (!business?.id || !user?.id) {
      throw new Error('Business or user not available')
    }

    try {
      setError(null)

      // Generate expense number
      const { data: expenseNumberResult, error: expenseNumberError } = await supabase
        .rpc('generate_expense_number', { business_id_param: business.id })

      if (expenseNumberError) throw expenseNumberError

      const { data: expense, error } = await supabase
        .from('expenses')
        .insert([{
          ...expenseData,
          business_id: business.id,
          expense_number: expenseNumberResult,
          expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0],
          payment_method: expenseData.payment_method || 'cash',
          is_tax_deductible: expenseData.is_tax_deductible ?? true,
          created_by: user.id
        }])
        .select(`
          *,
          category:expense_categories(*)
        `)
        .single()

      if (error) throw error

      // Add to local state
      setExpenses(prevExpenses => [expense, ...prevExpenses])

      return expense
    } catch (err) {
      console.error('Error creating expense:', err)
      setError(err instanceof Error ? err.message : 'Failed to create expense')
      return null
    }
  }

  // Update expense
  const updateExpense = async (expenseId: string, updates: Partial<CreateExpenseData>): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', expenseId)

      if (error) throw error

      // Update local state
      setExpenses(prevExpenses => 
        prevExpenses.map(expense => 
          expense.id === expenseId 
            ? { ...expense, ...updates, updated_at: new Date().toISOString() }
            : expense
        )
      )

      return true
    } catch (err) {
      console.error('Error updating expense:', err)
      setError(err instanceof Error ? err.message : 'Failed to update expense')
      return false
    }
  }

  // Delete expense
  const deleteExpense = async (expenseId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)

      if (error) throw error

      // Update local state
      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== expenseId))

      return true
    } catch (err) {
      console.error('Error deleting expense:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete expense')
      return false
    }
  }

  // Generate financial report
  const generateFinancialReport = async (startDate?: string, endDate?: string): Promise<FinancialReport | null> => {
    if (!business?.id) return null

    try {
      setError(null)

      const { data, error } = await supabase
        .rpc('get_financial_report', {
          business_id_param: business.id,
          start_date_param: startDate || null,
          end_date_param: endDate || null
        })

      if (error) throw error

      return data as FinancialReport
    } catch (err) {
      console.error('Error generating financial report:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate financial report')
      return null
    }
  }

  // Create expense category
  const createExpenseCategory = async (name: string, description?: string): Promise<ExpenseCategory | null> => {
    if (!business?.id || !user?.id) {
      throw new Error('Business or user not available')
    }

    try {
      setError(null)

      const { data: category, error } = await supabase
        .from('expense_categories')
        .insert([{
          business_id: business.id,
          name,
          description
        }])
        .select()
        .single()

      if (error) throw error

      // Add to local state
      setExpenseCategories(prevCategories => [...prevCategories, category].sort((a, b) => a.name.localeCompare(b.name)))

      return category
    } catch (err) {
      console.error('Error creating expense category:', err)
      setError(err instanceof Error ? err.message : 'Failed to create expense category')
      return null
    }
  }

  // Initialize default expense categories for new businesses
  const initializeDefaultCategories = async (): Promise<boolean> => {
    if (!business?.id) return false

    try {
      setError(null)

      const { error } = await supabase
        .rpc('create_default_expense_categories', { business_id_param: business.id })

      if (error) throw error

      // Reload categories
      await loadExpenseCategories()

      return true
    } catch (err) {
      console.error('Error initializing default categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize default categories')
      return false
    }
  }

  // Get expense summary for current month
  const getCurrentMonthSummary = async () => {
    if (!business?.id) return null

    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const endOfMonth = new Date()
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      endOfMonth.setDate(0)
      endOfMonth.setHours(23, 59, 59, 999)

      const report = await generateFinancialReport(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      )

      return report
    } catch (err) {
      console.error('Error getting current month summary:', err)
      return null
    }
  }

  // Load data on mount and when business changes
  useEffect(() => {
    if (business?.id) {
      loadExpenseCategories()
      loadExpenses()
    }
  }, [business?.id, loadExpenseCategories, loadExpenses])

  return {
    expenses,
    expenseCategories,
    loading,
    error,
    loadExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    generateFinancialReport,
    createExpenseCategory,
    initializeDefaultCategories,
    getCurrentMonthSummary,
    clearError: () => setError(null)
  }
}
