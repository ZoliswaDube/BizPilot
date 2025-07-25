import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'

interface RoleFormProps {
  onClose: () => void
  onSubmit: (name: string, description: string, permissions: string[]) => void
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !description) return

    setLoading(true)
    try {
      await onSubmit(name, description, permissions)
    } catch (err) {
      console.error('Error saving role:', err)
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

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
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
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

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
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter role name"
                  required
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
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter role description"
                  required
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
                          className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
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
                              className="rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
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
                disabled={loading || !name || !description}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors"
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