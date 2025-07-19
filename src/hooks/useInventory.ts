import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useBusiness } from './useBusiness'
import { Database } from '../lib/supabase'

type InventoryItem = Database['public']['Tables']['inventory']['Row']
type InsertInventoryItem = Database['public']['Tables']['inventory']['Insert']
type UpdateInventoryItem = Database['public']['Tables']['inventory']['Update']
type InsertInventoryTransaction = Database['public']['Tables']['inventory_transactions']['Insert']

export function useInventory() {
  const { user } = useAuth()
  const { business } = useBusiness()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && business) {
      fetchInventory()
    }
  }, [user, business])

  const fetchInventory = async () => {
    if (!user || !business) return

    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('inventory')
        .select(`*, products(name)`) // Fetch product name if linked
        .eq('business_id', business.id)
        .order('name', { ascending: true })

      if (error) throw error
      setInventory(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }

  const addInventoryItem = async (newItem: Omit<InsertInventoryItem, 'business_id'>) => {
    if (!user || !business) return { data: null, error: 'User not authenticated or no business' }
    try {
      setError(null)
      const { data, error } = await supabase
        .from('inventory')
        .insert({ ...newItem, business_id: business.id })
        .select()
        .single()

      if (error) throw error
      if (data) {
        // Also record an initial transaction
        await addInventoryTransaction({
          inventory_id: data.id,
          type: 'add',
          quantity_change: newItem.current_quantity || 0,
          new_quantity: newItem.current_quantity || 0,
          notes: 'Initial stock'
        })
        setInventory(prev => [...prev, data])
      }
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add inventory item'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const updateInventoryItem = async (id: string, updates: UpdateInventoryItem) => {
    if (!user || !business) return { data: null, error: 'User not authenticated or no business' }
    try {
      setError(null)
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .eq('business_id', business.id)
        .select()
        .single()

      if (error) throw error
      if (data) setInventory(prev => prev.map(item => item.id === id ? data : item))
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update inventory item'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteInventoryItem = async (id: string) => {
    if (!user || !business) return { error: 'User not authenticated or no business' }
    try {
      setError(null)
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('business_id', business.id)

      if (error) throw error
      setInventory(prev => prev.filter(item => item.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete inventory item'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  const addInventoryTransaction = async (newTransaction: Omit<InsertInventoryTransaction, 'business_id' | 'user_id'>) => {
    if (!user || !business) return { data: null, error: 'User not authenticated or no business' }
    try {
      setError(null)
      const { data, error } = await supabase
        .from('inventory_transactions')
        .insert({ ...newTransaction, business_id: business.id })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add inventory transaction'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Function to adjust stock and record transaction
  const adjustStock = async (inventoryId: string, change: number, notes: string = '') => {
    if (!user || !business) return { error: 'User not authenticated or no business' }
    try {
      setError(null)
      const currentItem = inventory.find(item => item.id === inventoryId)
      if (!currentItem) throw new Error('Inventory item not found')

      const newQuantity = currentItem.current_quantity + change

      const { data, error } = await supabase
        .from('inventory')
        .update({ current_quantity: newQuantity })
        .eq('id', inventoryId)
        .eq('business_id', business.id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        await addInventoryTransaction({
          inventory_id: data.id,
          type: change > 0 ? 'add' : 'remove',
          quantity_change: change,
          new_quantity: newQuantity,
          notes: notes
        })
        setInventory(prev => prev.map(item => item.id === inventoryId ? data : item))
      }
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust stock'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  return {
    inventory,
    loading,
    error,
    fetchInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustStock,
    addInventoryTransaction,
  }
}