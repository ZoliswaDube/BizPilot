import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'

interface RoleFormProps {
  onClose: () => void
  onSubmit: (name: string, description: string, permissions: string[]) => Promise<void>
  role?: {
    id: string
    name: string
    description: string
    permissions: Array<{
      id: string
      resource: string
      action: string
    }>
  }
}

const AVAILABLE_PERMISSIONS = {
  products: ['create', 'read', 'update', 'delete'],
  inventory: ['create', 'read', 'update', 'delete'],
  categories: ['create', 'read', 'update', 'delete'],
  suppliers: ['create', 'read', 'update', 'delete'],
  ai: ['create', 'read', 'update', 'delete'],
  qr: ['create', 'read', 'update', 'delete'],
  settings: ['read', 'update'],
  users: ['create', 'read', 'update', 'delete']
}

export function RoleForm({ onClose, onSubmit, role }: RoleFormProps) {
  const [name, setName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')
  const [permissions, setPermissions] = useState<string[]>(
    role?.permissions.map(p => `${p.resource}:${p.action}`) || []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!name.trim()) {
      setError('Role name is required')
      return
    }
    
    if (!description.trim()) {
      setError('Role description is required')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      await onSubmit(name.trim(), description.trim(), permissions)
      // onSubmit should handle success feedback and closing the modal
    } catch (err) {
      console.error('Error saving role:', err)
      setError(err instanceof Error ? err.message : 'Failed to save role')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionToggle = (resource: string, action: string) => {
    const permission = `${resource}:${action}`
    setPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    )
  }

  const handleSelectAll = (resource: string) => {
    const resourcePermissions = AVAILABLE_PERMISSIONS[resource as keyof typeof AVAILABLE_PERMISSIONS]
    const currentResourcePermissions = permissions.filter(p => p.startsWith(`${resource}:`))
    
    if (currentResourcePermissions.length === resourcePermissions.length) {
      // Remove all permissions for this resource
      setPermissions(prev => prev.filter(p => !p.startsWith(`${resource}:`)))
    } else {
      // Add all permissions for this resource
      const newPermissions = resourcePermissions.map(action => `${resource}:${action}`)
      setPermissions(prev => [
        ...prev.filter(p => !p.startsWith(`${resource}:`)),
        ...newPermissions
      ])
    }
  }

  const isFormValid = name.trim() && description.trim()

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-dark-900 rounded-xl shadow-xl border border-dark-700 p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-between mb-6">
            <motion.h2 
              className="text-xl font-bold text-gray-100"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {role ? 'Edit Role' : 'Create Role'}
            </motion.h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mb-6 flex items-center gap-3 p-4 bg-red-900/30 border-2 border-red-500/50 rounded-lg text-red-300 shadow-lg backdrop-blur-sm relative z-[60]"
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="absolute inset-0 bg-red-500/10 rounded-lg blur-sm"></div>
                <AlertCircle className="h-5 w-5 flex-shrink-0 relative z-10" />
                <div className="text-sm font-medium relative z-10 flex-1">
                  <div className="font-semibold text-red-200 mb-1">Error Creating Role</div>
                  <div className="text-red-300">{error}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (error) setError(null) // Clear error when user starts typing
                  }}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter role name (e.g., Sales Manager)"
                  required
                  disabled={loading}
                />
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    if (error) setError(null) // Clear error when user starts typing
                  }}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter role description"
                  required
                  disabled={loading}
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Permissions
              </label>
              <div className="border border-dark-600 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(AVAILABLE_PERMISSIONS).map(([resource, actions]) => (
                    <div key={resource} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-300 capitalize">
                          {resource}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleSelectAll(resource)}
                          disabled={loading}
                          className="text-xs text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50"
                        >
                          {permissions.filter(p => p.startsWith(`${resource}:`)).length === actions.length
                            ? 'Deselect All'
                            : 'Select All'
                          }
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {actions.map((action) => (
                          <label
                            key={`${resource}:${action}`}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={permissions.includes(`${resource}:${action}`)}
                              onChange={() => handlePermissionToggle(resource, action)}
                              disabled={loading}
                              className="rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                            />
                            <span className="text-xs text-gray-400 capitalize">
                              {action}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="flex space-x-4 pt-6"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>{role ? 'Update Role' : 'Create Role'}</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 