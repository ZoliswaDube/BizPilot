import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { supabase } from '../../lib/supabase'

interface BusinessFormData {
  name: string
  description: string
  address: string
  phone: string
  email: string
  website: string
}

export function BusinessOnboarding() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: user?.email || '',
    website: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      // Check if user is already associated with any business
      const { data: existingBusinessUser, error: checkError } = await supabase
        .from('business_users')
        .select('business_id, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (checkError) {
        throw checkError
      }

      if (existingBusinessUser) {
        throw new Error('You are already associated with a business. Each user can only be part of one business.')
      }

      // Create the business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          created_by: user.id // Track who created the business
        })
        .select()
        .single()

      if (businessError) {
        throw businessError
      }

      // Add the user as the admin/owner of the business
      const { error: businessUserError } = await supabase
        .from('business_users')
        .insert({
          business_id: business.id,
          user_id: user.id,
          role: 'admin', // First user is always admin/owner
          is_active: true,
          accepted_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })

      if (businessUserError) {
        throw businessUserError
      }

      // Update user profile with business_id
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ business_id: business.id })
        .eq('user_id', user.id)

      if (profileError) {
        console.warn('Failed to update user profile with business_id:', profileError)
        // Don't throw here as the business creation was successful
      }

      setSuccess(true)
      
      // Refresh the user's profile and business data
      await refreshProfile()
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 2000)

    } catch (err) {
      console.error('Error creating business:', err)
      setError(err instanceof Error ? err.message : 'Failed to create business')
    } finally {
      setLoading(false)
    }
  }

  const skipForNow = () => {
    // Allow user to continue without creating a business
    navigate('/dashboard')
  }

  if (success) {
    return (
      <motion.div 
        className="space-y-6 flex items-center justify-center min-h-screen"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-900/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2">Business Created!</h2>
          <p className="text-gray-400 mb-4">
            Your business has been successfully created. Redirecting to your dashboard...
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-16 h-16 bg-primary-900/20 border border-primary-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Welcome to BizPilot!</h1>
        <p className="text-gray-400">
          Let's get started by setting up your business. This will help us personalize your experience.
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        className="card max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Business Name *
              </label>
              <motion.input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter your business name"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Business Email
              </label>
              <motion.input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                placeholder="business@example.com"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <motion.input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input-field"
                placeholder="+1 (555) 123-4567"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">
                Website
              </label>
              <motion.input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="input-field"
                placeholder="https://www.yourbusiness.com"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
              Business Address
            </label>
            <motion.input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="input-field"
              placeholder="123 Business St, City, State 12345"
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Business Description
            </label>
            <motion.textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Tell us about your business..."
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            />
          </div>

          {error && (
            <motion.div 
              className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Business
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={skipForNow}
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Skip for now
            </motion.button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          You can always add or edit your business information later in settings.
        </div>
      </motion.div>
    </motion.div>
  )
}
