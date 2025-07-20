import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

interface UserSettings {
  id?: string
  user_id: string
  business_name: string | null
  hourly_rate: number
  default_margin: number
}

export function useUserSettings() {
  const { user } = useAuthStore()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    fetchSettings()
  }, [user])

  const fetchSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        // Create default settings if none exist
        const defaultSettings = {
          user_id: user.id,
          business_name: null,
          hourly_rate: 15.00,
          default_margin: 40.00
        }

        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert(defaultSettings)
          .select()
          .single()

        if (insertError) throw insertError
        setSettings(newSettings)
      } else {
        setSettings(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return

    try {
      setError(null)

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      setSettings(data)
      return { data, error: null }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update settings'
      setError(error)
      return { data: null, error }
    }
  }

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings
  }
}