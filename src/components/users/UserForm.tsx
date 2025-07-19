import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Shield, Check } from 'lucide-react'

interface UserRole {
  id: string
  name: string
  description: string
  permissions: Array<{
    id: string
    resource: string
    action: string
  }>
}

interface UserFormProps {
  onClose: () => void
  onSubmit: (email: string, role: string, permissions: string[]) => void
  userRoles: UserRole[]
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

export function UserForm({ onClose, onSubmit, userRoles }: UserFormProps) {
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [customPermissions, setCustomPermissions] = useState<string[]>([])
  const [showCustomPermissions, setShowCustomPermissions] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !selectedRole) return

    setLoading(true)
    try {
      const permissions = showCustomPermissions ? customPermissions : []
      await onSubmit(email, selectedRole, permissions)
    } catch (err) {
      console.error('Error inviting user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionToggle = (resource: string, action: string) => {
    const permission = `${resource}:${action}`
    setCustomPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    )
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
          className="bg-dark-900 rounded-xl shadow-xl border border-dark-700 p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
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
              Invite User
            </motion.h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter user's email address"
                required
              />
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role *
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select a role</option>
                {userRoles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showCustomPermissions}
                  onChange={(e) => setShowCustomPermissions(e.target.checked)}
                  className="rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-300">
                  Set custom permissions
                </span>
              </label>
            </motion.div>

            <AnimatePresence>
              {showCustomPermissions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="border border-dark-600 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-4">Permissions</h3>
                    <div className="space-y-4">
                      {Object.entries(AVAILABLE_PERMISSIONS).map(([resource, actions]) => (
                        <div key={resource} className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-400 capitalize">
                            {resource}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {actions.map((action) => (
                              <label
                                key={`${resource}:${action}`}
                                className="flex items-center space-x-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={customPermissions.includes(`${resource}:${action}`)}
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
              )}
            </AnimatePresence>

            <motion.div 
              className="flex space-x-4 pt-6"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                type="submit"
                disabled={loading || !email || !selectedRole}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Inviting...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Send Invitation</span>
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