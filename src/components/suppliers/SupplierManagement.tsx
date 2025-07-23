import { useState } from 'react'
import { Edit, Trash2, Loader2, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSuppliers } from '../../hooks/useSuppliers'
import { Database } from '../../lib/supabase'

type Supplier = Database['public']['Tables']['suppliers']['Row']

export function SupplierManagement() {
  const { suppliers, loading, error, addSupplier, updateSupplier, deleteSupplier } = useSuppliers()
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  })
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the supplier "${name}"? This cannot be undone.`)) {
      setFormError('')
      setSubmitLoading(true)
      const { error } = await deleteSupplier(id)
      if (error) {
        setFormError(error)
      }
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-400">Loading suppliers...</p>
        </div>
      </div>
    )
  }

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || ''
      })
    } else {
      setEditingSupplier(null)
      setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' })
    }
    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSupplier(null)
    setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' })
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!formData.name?.trim()) {
      setFormError('Supplier name cannot be empty.')
      return
    }
    setSubmitLoading(true)

    let resultError: string | null = null
    if (editingSupplier) {
      const { error } = await updateSupplier(editingSupplier.id, formData)
      resultError = error
    } else {
      const { error } = await addSupplier(formData as Omit<Database['public']['Tables']['suppliers']['Insert'], 'user_id'>)
      resultError = error
    }

    if (resultError) {
      setFormError(resultError)
    } else {
      closeModal()
    }
    setSubmitLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Supplier Management</h1>
          <p className="text-gray-400">Manage your product suppliers.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Supplier</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Suppliers List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Suppliers ({suppliers.length})</h2>
        {suppliers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No suppliers added yet.</p>
            <button
              onClick={() => openModal()}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Plus size={16} />
              <span>Add Your First Supplier</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-gray-200 font-medium text-lg">{supplier.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal(supplier)}
                      className="text-primary-400 hover:text-primary-300 transition-colors"
                      title="Edit supplier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete supplier"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {supplier.contact_person && (
                    <p className="text-sm text-gray-400">
                      <span className="font-medium">Contact:</span> {supplier.contact_person}
                    </p>
                  )}
                  {supplier.email && (
                    <p className="text-sm text-gray-400">
                      <span className="font-medium">Email:</span> {supplier.email}
                    </p>
                  )}
                  {supplier.phone && (
                    <p className="text-sm text-gray-400">
                      <span className="font-medium">Phone:</span> {supplier.phone}
                    </p>
                  )}
                  {supplier.address && (
                    <p className="text-sm text-gray-400">
                      <span className="font-medium">Address:</span> {supplier.address}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-dark-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-dark-700">
                <h3 className="text-lg font-semibold text-gray-100">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {formError}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input-field"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    disabled={submitLoading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contact_person" className="block text-sm font-medium text-gray-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    id="contact_person"
                    name="contact_person"
                    className="input-field"
                    value={formData.contact_person || ''}
                    onChange={handleInputChange}
                    disabled={submitLoading}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input-field"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    disabled={submitLoading}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    className="input-field"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    disabled={submitLoading}
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    className="input-field"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    disabled={submitLoading}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex items-center flex-1"
                    disabled={submitLoading}
                  >
                    {submitLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                    disabled={submitLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}