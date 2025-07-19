import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, Shield, Settings, Trash2, Edit, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { UserForm } from './UserForm'
import { RoleForm } from './RoleForm'

interface BusinessUser {
  id: string
  user_id: string
  role: string
  is_active: boolean
  invited_at: string
  accepted_at: string | null
  user: {
    email: string
    user_metadata: {
      full_name?: string
    }
  }
}

interface UserRole {
  id: string
  name: string
  description: string
  is_default: boolean
  permissions: UserPermission[]
}

interface UserPermission {
  id: string
  resource: string
  action: string
}

export function UserManagement() {
  const { user } = useAuth()
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingUser, setEditingUser] = useState<BusinessUser | null>(null)
  const [editingRole, setEditingRole] = useState<UserRole | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get current user's business
      const { data: businessUser } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

      if (!businessUser) {
        console.error('User is not an admin')
        return
      }

      // Load business users
      const { data: users, error: usersError } = await supabase
        .from('business_users')
        .select(`
          *,
          user:user_profiles(email, full_name)
        `)
        .eq('business_id', businessUser.business_id)

      if (usersError) throw usersError

      // Load user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          *,
          permissions:user_permissions(*)
        `)
        .eq('business_id', businessUser.business_id)

      if (rolesError) throw rolesError

      setBusinessUsers(users || [])
      setUserRoles(roles || [])
    } catch (err) {
      console.error('Error loading user management data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (email: string, role: string, permissions: string[]) => {
    try {
      // Create user invitation
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          role,
          business_id: businessUsers[0]?.business_id
        }
      })

      if (error) throw error

      // Add user to business with role
      const { error: businessUserError } = await supabase
        .from('business_users')
        .insert([{
          business_id: businessUsers[0]?.business_id,
          user_id: data.user?.id,
          role,
          invited_by: user?.id
        }])

      if (businessUserError) throw businessUserError

      setShowUserForm(false)
      loadData()
    } catch (err) {
      console.error('Error inviting user:', err)
    }
  }

  const handleUpdateUser = async (userId: string, role: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('business_users')
        .update({ role, is_active: isActive })
        .eq('user_id', userId)

      if (error) throw error

      setEditingUser(null)
      loadData()
    } catch (err) {
      console.error('Error updating user:', err)
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

      loadData()
    } catch (err) {
      console.error('Error deleting user:', err)
    }
  }

  const handleCreateRole = async (name: string, description: string, permissions: string[]) => {
    try {
      // Create role
      const { data: role, error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          business_id: businessUsers[0]?.business_id,
          name,
          description
        }])
        .select()
        .single()

      if (roleError) throw roleError

      // Create permissions
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

      if (permissionsError) throw permissionsError

      setShowRoleForm(false)
      loadData()
    } catch (err) {
      console.error('Error creating role:', err)
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
      className="min-h-screen bg-dark-950 px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="bg-dark-900 rounded-xl shadow-xl border border-dark-700 p-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-between mb-8">
            <motion.h1 
              className="text-2xl font-bold text-gray-100"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              User Management
            </motion.h1>
          </div>

          {/* Tab Navigation */}
          <motion.div 
            className="flex space-x-1 mb-8 bg-dark-800 rounded-lg p-1"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
                activeTab === 'users' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Users</span>
            </button>
            
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
                activeTab === 'roles' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>Roles</span>
            </button>
          </motion.div>

          {/* Users Tab */}
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
                    <Plus className="h-4 w-4" />
                    <span>Invite User</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {businessUsers.map((businessUser) => (
                    <motion.div
                      key={businessUser.id}
                      className="bg-dark-800 border border-dark-600 rounded-lg p-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-gray-100 font-medium">
                            {businessUser.user?.user_metadata?.full_name || businessUser.user?.email}
                          </h3>
                          <p className="text-gray-400 text-sm">{businessUser.user?.email}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              businessUser.role === 'admin' 
                                ? 'bg-red-900/20 text-red-400 border border-red-500/30'
                                : businessUser.role === 'manager'
                                ? 'bg-blue-900/20 text-blue-400 border border-blue-500/30'
                                : 'bg-gray-900/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {businessUser.role}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              businessUser.is_active 
                                ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                                : 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                              {businessUser.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingUser(businessUser)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(businessUser.user_id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Roles Tab */}
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
                    onClick={() => setShowRoleForm(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Role</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {userRoles.map((role) => (
                    <motion.div
                      key={role.id}
                      className="bg-dark-800 border border-dark-600 rounded-lg p-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-gray-100 font-medium">{role.name}</h3>
                          <p className="text-gray-400 text-sm">{role.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {role.permissions.map((permission) => (
                              <span
                                key={permission.id}
                                className="px-2 py-1 bg-gray-900/20 text-gray-400 border border-gray-500/30 rounded text-xs"
                              >
                                {permission.resource}:{permission.action}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingRole(role)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* User Form Modal */}
      <AnimatePresence>
        {showUserForm && (
          <UserForm
            onClose={() => setShowUserForm(false)}
            onSubmit={handleInviteUser}
            userRoles={userRoles}
          />
        )}
      </AnimatePresence>

      {/* Role Form Modal */}
      <AnimatePresence>
        {showRoleForm && (
          <RoleForm
            onClose={() => setShowRoleForm(false)}
            onSubmit={handleCreateRole}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
} 