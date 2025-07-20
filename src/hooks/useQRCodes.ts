import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import { Database } from '../lib/supabase'
import QRCodeLib from 'qrcode'

type QRCode = Database['public']['Tables']['qr_codes']['Row']
type UpdateQRCode = Database['public']['Tables']['qr_codes']['Update']

export interface QRCodeConfig {
  id?: string
  name: string
  business_name: string
  tip_amounts: number[]
  custom_message: string
}

export function useQRCodes() {
  const { user } = useAuthStore()
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchQRCodes()
    }
  }, [user])

  const fetchQRCodes = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setQrCodes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch QR codes')
    } finally {
      setLoading(false)
    }
  }

  const generateTipPageURL = (config: QRCodeConfig) => {
    // TODO: Replace with actual hosted tip page URL
    // This is currently a placeholder - implement a real tip page service
    const baseURL = `${window.location.origin}/tip`
    const params = new URLSearchParams({
      business: encodeURIComponent(config.business_name),
      amounts: config.tip_amounts.join(','),
      message: encodeURIComponent(config.custom_message)
    })
    
    return `${baseURL}?${params.toString()}`
  }

  const generateQRDataURL = async (config: QRCodeConfig): Promise<string> => {
    const url = generateTipPageURL(config)
    return await QRCodeLib.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff'
      }
    })
  }

  const createQRCode = async (config: QRCodeConfig) => {
    if (!user) return { data: null, error: 'User not authenticated' }

    try {
      setError(null)
      
      // Generate QR code data URL and page URL
      const qrDataUrl = await generateQRDataURL(config)
      const pageUrl = generateTipPageURL(config)
      
      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          user_id: user.id,
          name: config.name,
          business_name: config.business_name,
          tip_amounts: config.tip_amounts,
          custom_message: config.custom_message,
          qr_data_url: qrDataUrl,
          page_url: pageUrl
        })
        .select()
        .single()

      if (error) throw error
      
      setQrCodes(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create QR code'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const updateQRCode = async (id: string, config: Partial<QRCodeConfig>) => {
    if (!user) return { data: null, error: 'User not authenticated' }

    try {
      setError(null)
      
      let updateData: UpdateQRCode = {
        name: config.name,
        business_name: config.business_name,
        tip_amounts: config.tip_amounts,
        custom_message: config.custom_message
      }
      
      // If any core config changed, regenerate QR code
      if (config.business_name || config.tip_amounts || config.custom_message) {
        const fullConfig = {
          ...config,
          business_name: config.business_name || '',
          tip_amounts: config.tip_amounts || [],
          custom_message: config.custom_message || ''
        } as QRCodeConfig
        
        updateData.qr_data_url = await generateQRDataURL(fullConfig)
        updateData.page_url = generateTipPageURL(fullConfig)
      }
      
      const { data, error } = await supabase
        .from('qr_codes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      
      setQrCodes(prev => prev.map(qr => qr.id === id ? data : qr))
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update QR code'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteQRCode = async (id: string) => {
    if (!user) return { error: 'User not authenticated' }

    try {
      setError(null)
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      setQrCodes(prev => prev.filter(qr => qr.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete QR code'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  const downloadQRCode = (qrCode: QRCode) => {
    if (!qrCode.qr_data_url) return
    
    const link = document.createElement('a')
    link.download = `${qrCode.name}-qr-code.png`
    link.href = qrCode.qr_data_url
    link.click()
  }

  const copyTipURL = (qrCode: QRCode) => {
    if (!qrCode.page_url) return
    
    navigator.clipboard.writeText(qrCode.page_url)
  }

  return {
    qrCodes,
    loading,
    error,
    createQRCode,
    updateQRCode,
    deleteQRCode,
    downloadQRCode,
    copyTipURL,
    fetchQRCodes
  }
}