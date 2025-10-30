/**
 * Global Business Store
 * Manages business data with intelligent caching to prevent unnecessary re-fetching
 */

import { create } from 'zustand'
import { supabase } from '../lib/supabase'

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
  profile?: {
    email: string
    full_name?: string
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

interface BusinessState {
  // Data
  business: Business | null
  businessUsers: BusinessUser[]
  userRoles: UserRole[]
  userRole: string
  
  // State flags
  loading: boolean
  error: string | null
  lastFetch: number | null
  isInitialized: boolean
  
  // Cache settings
  cacheTimeout: number // 5 minutes default
  
  // Actions
  loadBusiness: (userId: string, forceRefresh?: boolean) => Promise<void>
  createBusiness: (businessData: Omit<Business, 'id' | 'created_at' | 'updated_at'>, userId: string) => Promise<Business>
  inviteUser: (email: string, role: string, userId: string) => Promise<void>
  updateUserRole: (userId: string, role: string) => Promise<void>
  removeUser: (userId: string) => Promise<void>
  clearCache: () => void
  hasPermission: (resource: string, action: string) => boolean
  isAdmin: () => boolean
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  // Initial state
  business: null,
  businessUsers: [],
  userRoles: [],
  userRole: '',
  loading: false,
  error: null,
  lastFetch: null,
  isInitialized: false,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  
  // Load business data with intelligent caching
  loadBusiness: async (userId: string, forceRefresh = false) => {
    const state = get()
    const now = Date.now()
    
    // Check if we should use cache
    if (!forceRefresh && state.isInitialized && state.lastFetch) {
      const timeSinceLastFetch = now - state.lastFetch
      if (timeSinceLastFetch < state.cacheTimeout) {
        console.log('[BusinessStore] Using cached data, no fetch needed')
        return // Use cached data
      }
    }
    
    // Don't fetch if already loading
    if (state.loading) {
      console.log('[BusinessStore] Already loading, skipping duplicate request')
      return
    }
    
    console.log('[BusinessStore] Fetching fresh business data')
    set({ loading: true, error: null })
    
    try {
      // Get user's business membership
      const { data: businessUserData, error: businessUserError } = await supabase
        .from('business_users')
        .select(`
          *,
          business:businesses(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .single()
      
      if (businessUserError) {
        console.error('[BusinessStore] Error fetching business user:', businessUserError)
        
        // Handle RLS policy errors
        if (businessUserError.code === 'PGRST301' || businessUserError.message?.includes('406')) {
          console.log('[BusinessStore] User has no business association')
          set({ 
            business: null, 
            userRole: '', 
            loading: false, 
            lastFetch: now,
            isInitialized: true 
          })
          return
        }
        
        set({ 
          business: null, 
          userRole: '', 
          loading: false, 
          error: 'Failed to load business data',
          isInitialized: true 
        })
        return
      }
      
      if (!businessUserData) {
        set({ 
          business: null, 
          userRole: '', 
          loading: false, 
          lastFetch: now,
          isInitialized: true 
        })
        return
      }
      
      // Set business data
      set({ 
        business: businessUserData.business,
        userRole: businessUserData.role 
      })
      
      // Load business users
      const { data: users } = await supabase
        .from('business_users')
        .select(`
          *,
          profile:user_profiles(email, full_name)
        `)
        .eq('business_id', businessUserData.business_id)
      
      if (users) {
        set({ businessUsers: users })
      }
      
      // Load user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select(`
          *,
          permissions:user_permissions(*)
        `)
        .eq('business_id', businessUserData.business_id)
      
      if (roles) {
        set({ userRoles: roles })
      }
      
      set({ 
        loading: false, 
        lastFetch: now,
        isInitialized: true,
        error: null
      })
      
      console.log('[BusinessStore] Business data loaded and cached')
      
    } catch (err) {
      console.error('[BusinessStore] Unexpected error:', err)
      set({ 
        loading: false, 
        error: 'Failed to load business data',
        isInitialized: true
      })
    }
  },
  
  // Create new business
  createBusiness: async (businessData, userId) => {
    console.log('[BusinessStore] Creating new business')
    
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
          user_id: userId,
          role: 'admin',
          accepted_at: new Date().toISOString()
        }])
      
      if (userError) throw userError
      
      // Update store
      set({ 
        business,
        userRole: 'admin',
        lastFetch: Date.now()
      })
      
      console.log('[BusinessStore] Business created successfully')
      return business
    } catch (err) {
      console.error('[BusinessStore] Error creating business:', err)
      throw err
    }
  },
  
  // Invite user to business
  inviteUser: async (email, role, inviterId) => {
    const { business } = get()
    if (!business) throw new Error('No business found')
    
    console.log('[BusinessStore] Inviting user:', email)
    
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
      await supabase
        .from('business_users')
        .insert([{
          business_id: business.id,
          user_id: data.user?.id,
          role,
          invited_by: inviterId
        }])
      
      // Reload business users
      await get().loadBusiness(inviterId, true)
      
    } catch (err) {
      console.error('[BusinessStore] Error inviting user:', err)
      throw err
    }
  },
  
  // Update user role
  updateUserRole: async (userId, role) => {
    const { business } = get()
    if (!business) throw new Error('No business found')
    
    console.log('[BusinessStore] Updating user role:', { userId, role })
    
    try {
      await supabase
        .from('business_users')
        .update({ role })
        .eq('user_id', userId)
        .eq('business_id', business.id)
      
      // Update local state
      set(state => ({
        businessUsers: state.businessUsers.map(u =>
          u.user_id === userId ? { ...u, role } : u
        )
      }))
      
    } catch (err) {
      console.error('[BusinessStore] Error updating role:', err)
      throw err
    }
  },
  
  // Remove user from business
  removeUser: async (userId) => {
    const { business } = get()
    if (!business) throw new Error('No business found')
    
    console.log('[BusinessStore] Removing user:', userId)
    
    try {
      await supabase
        .from('business_users')
        .delete()
        .eq('user_id', userId)
        .eq('business_id', business.id)
      
      // Update local state
      set(state => ({
        businessUsers: state.businessUsers.filter(u => u.user_id !== userId)
      }))
      
    } catch (err) {
      console.error('[BusinessStore] Error removing user:', err)
      throw err
    }
  },
  
  // Clear cache
  clearCache: () => {
    console.log('[BusinessStore] Clearing cache')
    set({ 
      lastFetch: null,
      isInitialized: false 
    })
  },
  
  // Check permission
  hasPermission: (resource, action) => {
    const { userRole, userRoles } = get()
    if (!userRole || !userRoles.length) return false
    
    const role = userRoles.find(r => r.name === userRole)
    if (!role) return false
    
    return role.permissions.some(p => 
      p.resource === resource && p.action === action
    )
  },
  
  // Check if admin
  isAdmin: () => {
    const { userRole } = get()
    return userRole === 'admin'
  }
}))
