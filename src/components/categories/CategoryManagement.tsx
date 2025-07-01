import { useState } from 'react'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { useCategories } from '../../hooks/useCategories'

export function CategoryManagement() {
  const { categories, loading, error, addCategory, updateCategory, deleteCategory } = useCategories()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!newCategoryName.trim()) {
      setFormError('Category name cannot be empty.')
      return
    }
    setSubmitLoading(true)
    const { error } = await addCategory({ name: newCategoryName.trim() })
    if (error) {
      setFormError(error)
    } else {
      setNewCategoryName('')
    }
    setSubmitLoading(false)
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!editingCategory || !editCategoryName.trim()) {
      setFormError('Category name cannot be empty.')
      return
    }
    setSubmitLoading(true)
    const { error } = await updateCategory(editingCategory.id, { name: editCategoryName.trim() })
    if (error) {
      setFormError(error)
    } else {
      setEditingCategory(null)
      setEditCategoryName('')
    }
    setSubmitLoading(false)
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${name}"? This cannot be undone.`)) {
      setFormError('')
      setSubmitLoading(true)
      const { error } = await deleteCategory(id)
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
          <p className="mt-2 text-gray-400">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Category Management</h1>
        <p className="text-gray-400">Organize your products with custom categories.</p>
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

      {/* Add/Edit Category Form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </h2>
        <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="flex gap-3">
          <input
            type="text"
            className="input-field flex-grow"
            placeholder="Category Name"
            value={editingCategory ? editCategoryName : newCategoryName}
            onChange={(e) => editingCategory ? setEditCategoryName(e.target.value) : setNewCategoryName(e.target.value)}
            disabled={submitLoading}
          />
          <button
            type="submit"
            className="btn-primary group flex items-center"
            disabled={submitLoading}
          >
            {submitLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {editingCategory ? 'Update' : 'Add'}
          </button>
          {editingCategory && (
            <button
              type="button"
              onClick={() => { setEditingCategory(null); setNewCategoryName(''); setEditCategoryName(''); setFormError('') }}
              className="btn-secondary"
              disabled={submitLoading}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* Categories List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Existing Categories</h2>
        {categories.length === 0 ? (
          <p className="text-gray-400">No categories added yet.</p>
        ) : (
          <ul className="divide-y divide-dark-700">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center justify-between py-3">
                <span className="text-gray-200">{category.name}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => { setEditingCategory(category); setEditCategoryName(category.name); setFormError('') }}
                    className="text-primary-400 hover:text-primary-300"
                    title="Edit category"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete category"
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