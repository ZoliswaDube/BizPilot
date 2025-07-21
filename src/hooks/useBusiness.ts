import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

interface Business {
  id: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  logo_url: string
  created_at: string
  updated_at: string
}

interface BusinessUser {
  id: string
  business_id: string
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
  business_id: string
  name: string
  description: string
  is_default: boolean
  permissions: UserPermission[]
}

interface UserPermission {
  id: string
  role_id: string
  resource: string
  action: string
}

export function useBusiness() {
  const { user } = useAuthStore()
  const [business, setBusiness] = useState<Business | null>(null)
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user's business and role
  useEffect(() => {
    if (!user) return

    const loadBusiness = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get user's business membership
        const { data: businessUserData, error: businessUserError } = await supabase
          .from('business_users')
          .select(`
            *,
            business:businesses(*)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('accepted_at', { ascending: false })
          .limit(1)
          .single()

        if (businessUserError) {
          console.error('Error fetching business user:', businessUserError)
          
          // Handle RLS policy errors (406) - user likely has no business association
          if (businessUserError.code === 'PGRST301' || businessUserError.message?.includes('406')) {
            console.log('RLS policy blocked access - user has no business association')
            setBusiness(null)
            setUserRole('')
            return
          }
          
          // For other errors, set to null and continue
          setBusiness(null)
          setUserRole('')
          return
        }

        if (!businessUserData) {
          // User doesn't have a business yet
          setBusiness(null)
          setUserRole('')
          return
        }

        if (businessUserData) {
          setBusiness(businessUserData.business)
          setUserRole(businessUserData.role)

          // Load business users
          const { data: users, error: usersError } = await supabase
            .from('business_users')
            .select(`
              *,
              profile:user_profiles(email, full_name)
            `)
            .eq('business_id', businessUserData.business_id)

          if (!usersError) {
            setBusinessUsers(users || [])
          }

          // Load user roles
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select(`
              *,
              permissions:user_permissions(*)
            `)
            .eq('business_id', businessUserData.business_id)

          if (!rolesError) {
            setUserRoles(roles || [])
          }
        }
      } catch (err) {
        console.error('Error loading business:', err)
        setError('Failed to load business data')
      } finally {
        setLoading(false)
      }
    }

    loadBusiness()
  }, [user])

  // Create new business
  const createBusiness = async (businessData: Omit<Business, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Create business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert([businessData])
        .select()
        .single()

      if (businessError) throw businessError

      // Add user as admin
      const { error: userError } = await supabase
        .from('business_users')
        .insert([{
          business_id: business.id,
          user_id: user.id,
          role: 'admin',
          accepted_at: new Date().toISOString()
        }])

      if (userError) throw userError

      setBusiness(business)
      setUserRole('admin')

      return business
    } catch (err) {
      console.error('Error creating business:', err)
      throw err
    }
  }

  // Invite user to business
  const inviteUser = async (email: string, role: string) => {
    if (!business || !user) throw new Error('Business or user not found')

    try {
      // Create user invitation
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          role,
          business_id: business.id
        }
      })

      if (error) throw error

      // Add user to business
      const { error: businessUserError } = await supabase
        .from('business_users')
        .insert([{
          business_id: business.id,
          user_id: data.user?.id,
          role,
          invited_by: user.id
        }])

      if (businessUserError) throw businessUserError

      // Reload business users
      const { data: users, error: usersError } = await supabase
        .from('business_users')
        .select(`
          *,
          profile:user_profiles(email, full_name)
        `)
        .eq('business_id', business.id)

      if (!usersError) {
        setBusinessUsers(users || [])
      }

      return data
    } catch (err) {
      console.error('Error inviting user:', err)
      throw err
    }
  }

  // Update user role
  const updateUserRole = async (userId: string, role: string) => {
    if (!business) throw new Error('Business not found')

    try {
      const { error } = await supabase
        .from('business_users')
        .update({ role })
        .eq('user_id', userId)
        .eq('business_id', business.id)

      if (error) throw error

      // Reload business users
      const { data: users, error: usersError } = await supabase
        .from('business_users')
        .select(`
          *,
          profile:user_profiles(email, full_name)
        `)
        .eq('business_id', business.id)

      if (!usersError) {
        setBusinessUsers(users || [])
      }
    } catch (err) {
      console.error('Error updating user role:', err)
      throw err
    }
  }

  // Remove user from business
  const removeUser = async (userId: string) => {
    if (!business) throw new Error('Business not found')

    try {
      const { error } = await supabase
        .from('business_users')
        .delete()
        .eq('user_id', userId)
        .eq('business_id', business.id)

      if (error) throw error

      // Reload business users
      const { data: users, error: usersError } = await supabase
        .from('business_users')
        .select(`
          *,
          profile:user_profiles(email, full_name)
        `)
        .eq('business_id', business.id)

      if (!usersError) {
        setBusinessUsers(users || [])
      }
    } catch (err) {
      console.error('Error removing user:', err)
      throw err
    }
  }

  // Check if user has permission
  const hasPermission = (resource: string, action: string): boolean => {
    if (!userRole || !userRoles.length) return false

    const role = userRoles.find(r => r.name === userRole)
    if (!role) return false

    return role.permissions.some(p => p.resource === resource && p.action === action)
  }

  // Check if user is admin
  const isAdmin = (): boolean => {
    return userRole === 'admin'
  }

  return {
    business,
    businessUsers,
    userRoles,
    userRole,
    loading,
    error,
    createBusiness,
    inviteUser,
    updateUserRole,
    removeUser,
    hasPermission,
    isAdmin
  }
} 