/**
 * Business Hook
 * Connects components to the global business store with intelligent caching
 * Prevents unnecessary re-fetching when switching tabs
 */

import { useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { useBusinessStore } from '../store/business'

// Type for business data creation
interface BusinessData {
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
}

export function useBusiness() {
  const { user } = useAuthStore()
  const {
    business,
    businessUsers,
    userRoles,
    userRole,
    loading,
    error,
    loadBusiness,
    createBusiness: storeCreateBusiness,
    inviteUser: storeInviteUser,
    updateUserRole: storeUpdateUserRole,
    removeUser: storeRemoveUser,
    hasPermission,
    isAdmin
  } = useBusinessStore()

  // Load business data when user changes
  useEffect(() => {
    if (!user) {
      console.log('[useBusiness] No user, skipping load')
      return
    }
    
    console.log('[useBusiness] Loading business for user:', user.id)
    // Load business data (will use cache if available)
    loadBusiness(user.id).catch(err => {
      console.error('[useBusiness] Failed to load business:', err)
    })
  }, [user?.id, loadBusiness]) // Include loadBusiness to ensure latest version

  // Wrapper functions that use the store functions with current user
  const createBusiness = async (businessData: BusinessData) => {
    if (!user) throw new Error('User not authenticated')
    return storeCreateBusiness(businessData as any, user.id)
  }

  const inviteUser = async (email: string, role: string) => {
    if (!user) throw new Error('User not authenticated')
    return storeInviteUser(email, role, user.id)
  }

  const updateUserRole = async (userId: string, role: string) => {
    return storeUpdateUserRole(userId, role)
  }

  const removeUser = async (userId: string) => {
    return storeRemoveUser(userId)
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