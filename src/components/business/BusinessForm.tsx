import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, Save, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'

interface BusinessFormData {
  name: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  logo_url: string
}

export function BusinessForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo_url: ''
  })

  useEffect(() => {
    if (id && id !== 'new') {
      loadBusiness()
    }
  }, [id])

  const loadBusiness = async () => {
    if (!id || !user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          logo_url: data.logo_url || ''
        })
      }
    } catch (err) {
      console.error('Error loading business:', err)
      setError('Failed to load business details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Client-side validation
    if (!formData.name.trim()) {
      setError('Business name is required')
      return
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Validate website URL format if provided
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      setError('Please enter a valid website URL (including http:// or https://)')
      return
    }

    // Validate logo URL format if provided
    if (formData.logo_url && !/^https?:\/\/.+/.test(formData.logo_url)) {
      setError('Please enter a valid logo URL (including http:// or https://)')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (id && id !== 'new') {
        // Update existing business
        const { error } = await supabase
          .from('businesses')
          .update(formData)
          .eq('id', id)

        if (error) throw error
        
        // Navigate to dashboard after successful update
        navigate('/dashboard')
      } else {
        // Create new business
        const { data, error } = await supabase
          .from('businesses')
          .insert([formData])
          .select()
          .single()

        if (error) throw error

        // Add the current user as admin of the business
        if (data) {
          const { error: userError } = await supabase
            .from('business_users')
            .insert([{
              business_id: data.id,
              user_id: user.id,
              role: 'admin',
              accepted_at: new Date().toISOString()
            }])

          if (userError) throw userError

          // Update user_profiles with new business_id
          const { error: profileError } = await supabase
            .from('user_profiles')
            .update({ business_id: data.id })
            .eq('user_id', user.id)
          if (profileError) console.error('Failed to update user_profiles:', profileError)

          // Update user_settings with new business_id
          const { error: settingsError } = await supabase
            .from('user_settings')
            .update({ business_id: data.id })
            .eq('user_id', user.id)
          if (settingsError) console.error('Failed to update user_settings:', settingsError)
        }

        // Navigate to dashboard after successful creation
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Error saving business:', err)
      
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('duplicate')) {
          setError('A business with this name already exists')
        } else if (err.message.includes('network')) {
          setError('Network error. Please check your connection and try again')
        } else if (err.message.includes('permission')) {
          setError('You do not have permission to perform this action')
        } else {
          setError(`Failed to save business: ${err.message}`)
        }
      } else {
        setError('An unexpected error occurred. Please try again')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-dark-950"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-primary-400" />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="min-h-screen bg-dark-950 px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-2xl mx-auto">
        <motion.div 
          className="bg-dark-900 rounded-xl shadow-xl border border-dark-700 p-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-between mb-8">
            <motion.h1 
              className="text-2xl font-bold text-gray-100"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {id === 'new' ? 'Create Business' : 'Edit Business'}
            </motion.h1>
            
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <X className="h-6 w-6" />
            </motion.button>
          </div>

          {error && (
            <motion.div 
              className="mb-6 p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter business name"
                required
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter business description"
                rows={3}
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter business address"
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter business email"
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://yourbusiness.com"
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => handleInputChange('logo_url', e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://example.com/logo.png"
              />
            </motion.div>

            <motion.div 
              className="flex space-x-4 pt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>{id === 'new' ? 'Create Business' : 'Save Changes'}</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
} 