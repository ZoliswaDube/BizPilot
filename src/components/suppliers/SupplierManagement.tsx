import { useState } from 'react'
import { Edit, Trash2, Loader2 } from 'lucide-react'
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddOrUpdateSupplier = async (e: React.FormEvent) => {
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
      setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' })
      setEditingSupplier(null)
    }
    setSubmitLoading(false)
  }

  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || ''
    })
    setFormError('')
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Supplier Management</h1>
        <p className="text-gray-400">Manage your product suppliers.</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {formError && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {formError}
        </div>
      )}

      {/* Add/Edit Supplier Form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">
          {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        </h2>
        <form onSubmit={handleAddOrUpdateSupplier} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Supplier Name *</label>
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
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-300 mb-1">Contact Person</label>
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
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
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
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
            <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">Address</label>
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
          <div className="flex gap-3">
            <button
              type="submit"
              className="btn-primary group flex items-center"
              disabled={submitLoading}
            >
              {submitLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
            {editingSupplier && (
              <button
                type="button"
                onClick={() => { setEditingSupplier(null); setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' }); setFormError('') }}
                className="btn-secondary"
                disabled={submitLoading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Suppliers List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Existing Suppliers</h2>
        {suppliers.length === 0 ? (
          <p className="text-gray-400">No suppliers added yet.</p>
        ) : (
          <ul className="divide-y divide-dark-700">
            {suppliers.map((supplier) => (
              <li key={supplier.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="text-gray-200 font-medium">{supplier.name}</span>
                  {supplier.contact_person && <p className="text-sm text-gray-400">{supplier.contact_person}</p>}
                  {supplier.email && <p className="text-xs text-gray-500">{supplier.email}</p>}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(supplier)}
                    className="text-primary-400 hover:text-primary-300"
                    title="Edit supplier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete supplier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}