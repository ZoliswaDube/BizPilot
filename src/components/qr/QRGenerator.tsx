import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle, Plus } from 'lucide-react'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useQRCodes, QRCodeConfig } from '../../hooks/useQRCodes'

export function QRGenerator() {
  const { settings } = useUserSettings()
  const { loading, error, createQRCode } = useQRCodes()
  
  const [formData, setFormData] = useState<QRCodeConfig>({
    name: '',
    business_name: '',
    tip_amounts: [5, 10, 15, 20],
    custom_message: 'Thank you for your support!'
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Initialize business name from settings
  useEffect(() => {
    if (settings?.business_name && !formData.business_name) {
      setFormData(prev => ({
        ...prev,
        business_name: settings.business_name || ''
      }))
    }
  }, [settings, formData.business_name])

  const resetForm = () => {
    setFormData({
      name: '',
      business_name: settings?.business_name || '',
      tip_amounts: [5, 10, 15, 20],
      custom_message: 'Thank you for your support!'
    })
    setEditingId(null)
    setFormError('')
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    setFormError('')
    setSuccess(false)

    // Validation
    if (!formData.name.trim()) {
      setFormError('QR code name is required')
      setSubmitLoading(false)
      return
    }
    if (!formData.business_name) {
      setFormError('Business name is required')
      setSubmitLoading(false)
      return
    }
    if (formData.tip_amounts.some(amount => amount <= 0)) {
      setFormError('All tip amounts must be greater than 0')
      setSubmitLoading(false)
      return
    }

    try {
      let result
      if (editingId) {
        // For this simplified version, we'll just create new QR codes
        result = await createQRCode(formData)
      } else {
        result = await createQRCode(formData)
      }

      if (result.error) {
        setFormError(result.error)
      } else {
        setSuccess(true)
        resetForm()
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setFormError('Failed to save QR code')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-400">Loading QR codes...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-bold text-gray-100">QR Tip Generator</h1>
          <p className="text-gray-400">Create and manage QR codes that link to custom tip pages</p>
        </motion.div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Plus className="h-4 w-4 mr-2" />
          </motion.div>
          {showForm ? 'Cancel' : 'Create QR Code'}
        </motion.button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div 
            className="bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
            </motion.div>
            QR code {editingId ? 'updated' : 'created'} successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <h2 className="text-lg font-semibold text-gray-100 mb-4">
              {editingId ? 'Edit QR Code' : 'Create New QR Code'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {formError && (
                  <motion.div 
                    className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {formError}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  QR Code Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Restaurant Tip QR"
                  disabled={submitLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-gray-300 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  id="business_name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  className="input-field"
                  placeholder="Your Business Name"
                  disabled={submitLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="custom_message" className="block text-sm font-medium text-gray-300 mb-1">
                  Custom Message
                </label>
                <input
                  type="text"
                  id="custom_message"
                  name="custom_message"
                  value={formData.custom_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_message: e.target.value }))}
                  className="input-field"
                  placeholder="Thank you for your support!"
                  disabled={submitLoading}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="btn-primary group flex items-center"
                >
                  {submitLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingId ? 'Update QR Code' : 'Create QR Code'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="card bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        <h3 className="font-semibold text-blue-300 mb-2">QR Code Features</h3>
        <p className="text-blue-200 text-sm">
          Create QR codes that link to custom tip pages for your business. 
          Customers can scan the code to leave tips digitally with preset amounts.
        </p>
      </motion.div>
    </motion.div>
  )
}