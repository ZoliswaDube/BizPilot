import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Settings, Loader2, Plus, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useBusiness } from '../../hooks/useBusiness'
import { supabase } from '../../lib/supabase'
import { UserForm } from './UserForm'
import { RoleForm } from './RoleForm'

interface BusinessUser {
  id: string
  user_id: string
  role: string
  is_active: boolean
  email?: string
  full_name?: string
  created_at: string
}

interface UserRole {
  id: string
  name: string
  description: string
  is_default: boolean
  permissions: Array<{
    id: string
    resource: string
    action: string
  }>
}

// Toast notification component
interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      } text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3`}
    >
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5" />
      ) : (
        <AlertCircle className="h-5 w-5" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export function UserManagement() {
  const { user } = useAuthStore()
  const { business } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users')
  const [showUserForm, setShowUserForm] = useState(false)
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingRole, setEditingRole] = useState<UserRole | null>(null)
  const [editingUser, setEditingUser] = useState<BusinessUser | null>(null)
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Loading states
  const [roleCreationLoading, setRoleCreationLoading] = useState(false)

  const businessId = business?.id

  // Load data on component mount and when businessId changes
  useEffect(() => {
    const loadData = async () => {
      if (!businessId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log('🔄 UserManagement: Loading data for business:', businessId)
        
        // Load both users and roles
        await Promise.all([
          loadBusinessUsers(),
          loadUserRoles()
        ])
        
        console.log('✅ UserManagement: Data loaded successfully')
      } catch (error) {
        console.error('💥 UserManagement: Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [businessId])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  const closeToast = () => {
    setToast(null)
  }

  useEffect(() => {
    if (businessId) {
      loadData()
    }
  }, [businessId])

  const loadData = async () => {
    if (!businessId) return

    try {
      setLoading(true)
      await Promise.all([loadBusinessUsers(), loadUserRoles()])
    } catch (err) {
      console.error('Error loading data:', err)
      showToast('Failed to load user management data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadBusinessUsers = async () => {
    if (!businessId) {
      console.log('📋 loadBusinessUsers: No businessId, skipping')
      return
    }

    console.log('🔍 loadBusinessUsers: Starting with businessId:', businessId)

    try {
      const { data, error } = await supabase
        .from('business_users')
        .select(`
          *,
          user_profiles(email, full_name)
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      console.log('🔍 loadBusinessUsers query result:', { data, error, businessId })
      
      if (error) throw error
      
      console.log('📋 loadBusinessUsers: Setting businessUsers:', data || [])
      setBusinessUsers(data || [])
    } catch (err) {
      console.error('💥 Error loading business users:', err)
      throw err
    }
  }

  const loadUserRoles = async () => {
    if (!businessId) {
      console.log('📋 loadUserRoles: No businessId, skipping')
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          user_permissions(*)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const formattedRoles = (data || []).map(role => ({
        ...role,
        permissions: role.user_permissions || []
      }))

      console.log('📋 loadUserRoles: Setting roles:', formattedRoles)
      setUserRoles(formattedRoles)
    } catch (err) {
      console.error('💥 Error loading user roles:', err)
      showToast('Failed to load roles', 'error')
      throw err
    }
  }

  const handleCreateUser = async (email: string, password: string, fullName: string, role: string, _permissions: string[]) => {
    if (!businessId) {
      showToast('No business ID available', 'error')
      return
    }

    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showToast('You must be logged in to create users', 'error')
        return
      }

      // Call Edge Function to create user securely
      const { data, error } = await supabase.functions.invoke('create-business-user', {
        body: {
          email,
          password,
          fullName,
          role,
          businessId
        }
      })

      if (error) throw error
      if (data.error) throw new Error(data.error)

      // Success! Edge Function handled user creation, profile creation, and business association
      setShowUserForm(false)
      showToast(`User ${fullName} created successfully`, 'success')
      await loadBusinessUsers() // Reload users to show the new user
    } catch (err) {
      console.error('Error creating user:', err)
      showToast(
        err instanceof Error ? err.message : 'Failed to create user',
        'error'
      )
    }
  }

  const handleEditUser = (user: BusinessUser) => {
    setEditingUser(user)
    setShowUserForm(true)
  }

  const handleUpdateUser = async (email: string, password: string, fullName: string, role: string, _permissions: string[]) => {
    if (!editingUser || !businessId) {
      showToast('No user selected for editing', 'error')
      return
    }

    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          email,
          full_name: fullName
        })
        .eq('user_id', editingUser.user_id)

      if (profileError) throw profileError

      // Update business user role
      const { error: businessUserError } = await supabase
        .from('business_users')
        .update({ role })
        .eq('user_id', editingUser.user_id)
        .eq('business_id', businessId)

      if (businessUserError) throw businessUserError

      // Update auth email and password if changed
      const authUpdates: any = {}
      if (email !== (editingUser as any).user_profiles?.email) {
        authUpdates.email = email
      }
      if (password && password.trim()) {
        authUpdates.password = password
      }
      
      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          editingUser.user_id,
          authUpdates
        )
        if (authError) {
          console.warn('Failed to update auth user:', authError)
          // Don't throw - profile update succeeded
        }
      }

      setShowUserForm(false)
      setEditingUser(null)
      showToast(`User ${fullName} updated successfully`, 'success')
      await loadBusinessUsers()
    } catch (err) {
      console.error('Error updating user:', err)
      showToast(
        err instanceof Error ? err.message : 'Failed to update user',
        'error'
      )
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return

    try {
      const { error } = await supabase
        .from('business_users')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      showToast('User removed successfully', 'success')
      loadData()
    } catch (err) {
      console.error('Error deleting user:', err)
      showToast('Failed to remove user', 'error')
    }
  }

  const handleCreateRole = async (name: string, description: string, permissions: string[]) => {
    console.log('🔨 Creating role:', name, 'for business:', businessId)
    
    if (!businessId) {
      showToast('No business ID available', 'error')
      return
    }

    setRoleCreationLoading(true)
    try {
      // Create role using RPC function
      const { data: roleData, error: roleError } = await supabase
        .rpc('create_user_role', {
          p_business_id: businessId,
          p_name: name,
          p_description: description,
          p_created_by: user?.id
        })
      
      console.log('🔍 Role creation result:', { data: roleData, error: roleError })

      if (roleError) {
        console.error('Role creation error:', roleError)
        throw new Error(roleError.message || 'Failed to create role')
      }

      if (!roleData || roleData.length === 0) {
        throw new Error('No role data returned from server')
      }

      const role = roleData[0]

      // Create permissions if any were provided
      if (permissions.length > 0) {
        const permissionsData = permissions.map(permission => {
          const [resource, action] = permission.split(':')
          return {
            role_id: role.id,
            resource,
            action
          }
        })

        const { error: permissionsError } = await supabase
          .from('user_permissions')
          .insert(permissionsData)

        if (permissionsError) {
          console.error('Permissions creation error:', permissionsError)
          // Don't throw here - role was created successfully, just log the permission error
          showToast(`Role "${name}" created, but some permissions failed to save`, 'error')
        }
      }

      setShowRoleForm(false)
      setEditingRole(null)
      showToast(`Role "${name}" created successfully`, 'success')
      
      // Force refresh the role list to ensure new role appears
      await loadUserRoles()
      
      // Also refresh all data as backup
      await loadData()
      
      console.log('✅ Role created and UI refreshed')
    } catch (err) {
      console.error('Error creating role:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role'
      showToast(errorMessage, 'error')
    } finally {
      setRoleCreationLoading(false)
    }
  }

  const handleEditRole = (role: UserRole) => {
    setEditingRole(role)
    setShowRoleForm(true)
  }

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId)

      if (error) throw error

      showToast(`Role "${roleName}" deleted successfully`, 'success')
      loadData()
    } catch (err) {
      console.error('Error deleting role:', err)
      showToast('Failed to delete role', 'error')
    }
  }

  if (loading) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-dark-950"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-primary-400" />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-dark-950 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-gray-100 mb-2">User Management</h1>
          <p className="text-gray-400">Manage users and roles for your business</p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="flex space-x-1 bg-dark-800 p-1 rounded-lg mb-6 w-fit"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === 'roles'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Roles
          </button>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-100">Business Users</h2>
                <button
                  onClick={() => setShowUserForm(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add User</span>
                </button>
              </div>

              <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-800 border-b border-dark-700">
                      <tr>
                        <th className="text-left py-3 px-6 text-gray-300 font-medium">Name</th>
                        <th className="text-left py-3 px-6 text-gray-300 font-medium">Email</th>
                        <th className="text-left py-3 px-6 text-gray-300 font-medium">Role</th>
                        <th className="text-left py-3 px-6 text-gray-300 font-medium">Status</th>
                        <th className="text-left py-3 px-6 text-gray-300 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businessUsers.map((businessUser) => (
                        <tr key={businessUser.id} className="border-b border-dark-700 hover:bg-dark-800/50 transition-colors">
                          <td className="py-4 px-6 text-gray-100">
                            {(businessUser as any).user_profiles?.full_name || 'Unknown User'}
                          </td>
                          <td className="py-4 px-6 text-gray-300">
                            {(businessUser as any).user_profiles?.email || 'No email'}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              businessUser.role === 'admin' 
                                ? 'bg-red-500/20 text-red-400'
                                : businessUser.role === 'manager'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {businessUser.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              businessUser.is_active
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {businessUser.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditUser(businessUser)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit user"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(businessUser.user_id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'roles' && (
            <motion.div
              key="roles"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-100">User Roles</h2>
                <button
                  onClick={() => {
                    setEditingRole(null)
                    setShowRoleForm(true)
                  }}
                  disabled={roleCreationLoading}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {roleCreationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>Create Role</span>
                </button>
              </div>

              <div className="space-y-4">
                {userRoles.map((role) => (
                  <motion.div
                    key={role.id}
                    className="bg-dark-900 rounded-lg border border-dark-700 p-4 flex items-center justify-between hover:bg-dark-800 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-100">{role.name}</h3>
                        {role.is_default && (
                          <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            Default Role
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{role.description}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-300">Permissions:</span>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 4).map((permission) => (
                            <span
                              key={`${permission.resource}:${permission.action}`}
                              className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded"
                            >
                              {permission.resource}:{permission.action}
                            </span>
                          ))}
                          {role.permissions.length > 4 && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                              +{role.permissions.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!role.is_default && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditRole(role)}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-blue-500/10 rounded"
                          title="Edit role"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id, role.name)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded"
                          title="Delete role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Form Modal */}
      <AnimatePresence>
        {showUserForm && (
          <UserForm
            onClose={() => {
              setShowUserForm(false)
              setEditingUser(null)
            }}
            onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
            userRoles={userRoles}
            editingUser={editingUser}
          />
        )}
      </AnimatePresence>

      {/* Role Form Modal */}
      <AnimatePresence>
        {showRoleForm && (
          <RoleForm
            onClose={() => {
              setShowRoleForm(false)
              setEditingRole(null)
            }}
            onSubmit={handleCreateRole}
            role={editingRole || undefined}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
} 