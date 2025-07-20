import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import { Database } from '../lib/supabase'

type Supplier = Database['public']['Tables']['suppliers']['Row']
type InsertSupplier = Database['public']['Tables']['suppliers']['Insert']
type UpdateSupplier = Database['public']['Tables']['suppliers']['Update']

export function useSuppliers() {
  const { user } = useAuthStore()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchSuppliers()
    }
  }, [user])

  const fetchSuppliers = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) throw error
      setSuppliers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }

  const addSupplier = async (newSupplier: Omit<InsertSupplier, 'user_id'>) => {
    if (!user) return { data: null, error: 'User not authenticated' }
    try {
      setError(null)
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ ...newSupplier, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      if (data) setSuppliers(prev => [...prev, data])
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add supplier'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const updateSupplier = async (id: string, updates: UpdateSupplier) => {
    if (!user) return { data: null, error: 'User not authenticated' }
    try {
      setError(null)
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      if (data) setSuppliers(prev => prev.map(sup => sup.id === id ? data : sup))
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update supplier'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteSupplier = async (id: string) => {
    if (!user) return { error: 'User not authenticated' }
    try {
      setError(null)
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      setSuppliers(prev => prev.filter(sup => sup.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete supplier'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  }
}