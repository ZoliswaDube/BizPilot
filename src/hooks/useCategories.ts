import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import { Database } from '../lib/supabase'

type Category = Database['public']['Tables']['categories']['Row']
type InsertCategory = Database['public']['Tables']['categories']['Insert']
type UpdateCategory = Database['public']['Tables']['categories']['Update']

export function useCategories() {
  const { user } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchCategories()
    }
  }, [user])

  const fetchCategories = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async (newCategory: Omit<InsertCategory, 'user_id'>) => {
    if (!user) return { data: null, error: 'User not authenticated' }
    try {
      setError(null)
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...newCategory, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      if (data) setCategories(prev => [...prev, data])
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add category'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const updateCategory = async (id: string, updates: UpdateCategory) => {
    if (!user) return { data: null, error: 'User not authenticated' }
    try {
      setError(null)
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      if (data) setCategories(prev => prev.map(cat => cat.id === id ? data : cat))
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteCategory = async (id: string) => {
    if (!user) return { error: 'User not authenticated' }
    try {
      setError(null)
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      setCategories(prev => prev.filter(cat => cat.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  }
}