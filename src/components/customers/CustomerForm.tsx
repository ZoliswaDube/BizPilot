import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Loader2, User, Mail, Phone, Building2, MapPin, FileText, Tag } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useBusiness } from '../../hooks/useBusiness'
import { useCustomers } from '../../hooks/useCustomers'
import { supabase } from '../../lib/supabase'
import type { Customer } from '../../types/orders'

interface CustomerFormData {
  name: string
  email: string
  phone: string
  company: string
  address: {
    street?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  notes: string
  tags: string[]
  preferred_contact_method: 'email' | 'phone' | 'sms'
}

export function CustomerForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()
  const { business } = useBusiness()
  const { createCustomer, updateCustomer } = useCustomers()

  const isEditMode = !!id
  const [loading, setLoading] = useState(isEditMode)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [tagInput, setTagInput] = useState('')

  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'South Africa'
    },
    notes: '',
    tags: [],
    preferred_contact_method: 'email'
  })

  // Load customer data if editing
  useEffect(() => {
    if (isEditMode && id && business?.id) {
      loadCustomerData(id)
    }
  }, [isEditMode, id, business?.id])

  const loadCustomerData = async (customerId: string) => {
    try {
      setLoading(true)
      setError('')

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('business_id', business?.id)
        .single()

      if (customerError) throw customerError
      if (!customer) throw new Error('Customer not found')

      const address = typeof customer.address === 'string' 
        ? JSON.parse(customer.address) 
        : customer.address || {}

      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        address: {
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          postal_code: address.postal_code || '',
          country: address.country || 'South Africa'
        },
        notes: customer.notes || '',
        tags: customer.tags || [],
        preferred_contact_method: customer.preferred_contact_method || 'email'
      })
    } catch (err) {
      console.error('Error loading customer:', err)
      setError(err instanceof Error ? err.message : 'Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.name.trim()) {
      errors.push('Customer name is required')
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Invalid email address')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !business) {
      setError('User not authenticated or no business found')
      return
    }

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const customerData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        address: Object.values(formData.address).some(v => v) ? formData.address : undefined,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags,
        preferred_contact_method: formData.preferred_contact_method
      }

      if (isEditMode && id) {
        await updateCustomer(id, customerData)
      } else {
        await createCustomer(customerData)
      }

      navigate('/customers')
    } catch (err) {
      console.error('Error saving customer:', err)
      setError(err instanceof Error ? err.message : 'Failed to save customer')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-400">Loading...</p>
        </div>
      </div>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 text-gray-400 hover:text-gray-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {isEditMode ? 'Edit Customer' : 'Add Customer'}
            </h1>
            <p className="text-gray-400 mt-1">
              {isEditMode ? 'Update customer information' : 'Add a new customer to your database'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card bg-red-900/20 border-red-500/30">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Customer Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-field pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field pl-10"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-field pl-10"
                  placeholder="+27 12 345 6789"
                />
              </div>
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="input-field pl-10"
                  placeholder="ABC Company"
                />
              </div>
            </div>

            {/* Preferred Contact Method */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preferred Contact Method
              </label>
              <select
                value={formData.preferred_contact_method}
                onChange={(e) => handleInputChange('preferred_contact_method', e.target.value)}
                className="input-field"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Address</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Street */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                className="input-field"
                placeholder="123 Main Street"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                className="input-field"
                placeholder="Johannesburg"
              />
            </div>

            {/* State/Province */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Province/State
              </label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
                className="input-field"
                placeholder="Gauteng"
              />
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.address.postal_code}
                onChange={(e) => handleInputChange('address.postal_code', e.target.value)}
                className="input-field"
                placeholder="2000"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.address.country}
                onChange={(e) => handleInputChange('address.country', e.target.value)}
                className="input-field"
                placeholder="South Africa"
              />
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Additional Details</h2>
          
          <div className="space-y-4">
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Notes</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Any additional notes about this customer..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>Tags</span>
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="input-field"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-primary-900/30 text-primary-400 border border-primary-500/30 flex items-center space-x-2"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-primary-400 hover:text-primary-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>{isEditMode ? 'Update Customer' : 'Add Customer'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
