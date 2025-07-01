import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, QrCode, Building, DollarSign, Loader2, CheckCircle, Plus, Edit, Trash2, Copy } from 'lucide-react'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useQRCodes, QRCodeConfig } from '../../hooks/useQRCodes'

interface TipAmount {
  id: string
  amount: number
  label: string
}

export function QRGenerator() {
  const { settings } = useUserSettings()
  const { qrCodes, loading, error, createQRCode, updateQRCode, deleteQRCode, downloadQRCode, copyTipURL } = useQRCodes()
  
  const [formData, setFormData] = useState<QRCodeConfig>({
    name: '',
    business_name: '',
    tip_amounts: [5, 10, 15, 20],
    custom_message: 'Thank you for your support!'
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const updateTipAmount = (index: number, amount: number) => {
    setFormData(prev => ({
      ...prev,
      tip_amounts: prev.tip_amounts.map((tip, i) => i === index ? amount : tip)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setFormError('')
    setSuccess(false)

    // Validation
    if (!formData.name.trim()) {
      setFormError('QR code name is required')
      setIsGenerating(false)
      return
    }
    if (!formData.business_name.trim()) {
      setFormError('Business name is required')
      setIsGenerating(false)
      return
    }
    if (formData.tip_amounts.some(amount => amount <= 0)) {
      setFormError('All tip amounts must be greater than 0')
      setIsGenerating(false)
      return
    }

    try {
      let result
      if (editingId) {
        result = await updateQRCode(editingId, formData)
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
      setIsGenerating(false)
    }
  }

  const handleEdit = (qrCode: any) => {
    setFormData({
      name: qrCode.name,
      business_name: qrCode.business_name || '',
      tip_amounts: qrCode.tip_amounts,
      custom_message: qrCode.custom_message || ''
    })
    setEditingId(qrCode.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteQRCode(id)
    }
  }

  const handleCopyURL = (qrCode: any) => {
    copyTipURL(qrCode)
    // Simple feedback - in a real app you might use a toast notification
    alert('Tip page URL copied to clipboard!')
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
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
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
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}