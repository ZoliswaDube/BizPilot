import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Session, AuthError, Provider } from '@supabase/supabase-js'
import * as Sentry from '@sentry/react'
import { supabase, getURL } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type BusinessUser = Database['public']['Tables']['business_users']['Row']

interface AuthState {
  // Core state
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  businessUser: BusinessUser | null
  loading: boolean
  
  // Derived state
  role: string | null
  isAdmin: boolean
  isEmployee: boolean
  isManager: boolean
  
  // Actions
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithProvider: (provider: Provider) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  resendVerification: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
  
  // Internal actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setUserProfile: (profile: UserProfile | null) => void
  setBusinessUser: (businessUser: BusinessUser | null) => void
  setLoading: (loading: boolean) => void
  fetchUserProfile: (userId: string) => Promise<void>
  fetchBusinessUser: (userId: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      userProfile: null,
      businessUser: null,
      loading: true,
      
      // Derived state
      role: null,
      isAdmin: false,
      isEmployee: false,
      isManager: false,
      
      // Internal actions
      setUser: (user) => {
        set({ user })
        
        // Update Sentry user context
        if (user) {
          Sentry.setUser({
            id: user.id,
            email: user.email,
          })
        } else {
          Sentry.setUser(null)
        }
      },
      
      setSession: (session) => set({ session }),
      
      setUserProfile: (profile) => set({ userProfile: profile }),
      
      setBusinessUser: (businessUser) => {
        const role = businessUser?.role || null
        set({ 
          businessUser,
          role,
          isAdmin: role === 'admin',
          isEmployee: role === 'employee',
          isManager: role === 'manager'
        })
      },
      
      setLoading: (loading) => set({ loading }),
      
      fetchUserProfile: async (userId: string) => {
        console.log('🔐 useAuthStore: fetchUserProfile called', { userId })
        
        try {
          console.log('🔐 useAuthStore: Starting profile fetch query...')
          
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()
          
          console.log('🔐 useAuthStore: fetchUserProfile result', { 
            hasProfile: !!profile, 
            error: error?.message,
            errorCode: error?.code
          })
          
          // Check if user changed during fetch (race condition protection)
          const currentUser = get().user
          if (!currentUser || currentUser.id !== userId) {
            console.log('🔐 useAuthStore: User changed during profile fetch, aborting')
            return
          }
          
          if (error) {
            console.error('🔐 useAuthStore: Error fetching user profile:', error)
            
            // Handle case where profile doesn't exist yet (PGRST116 = no rows returned)
            if (error.code === 'PGRST116') {
              console.log('🔐 useAuthStore: Profile not found (PGRST116), database triggers will handle creation')
              get().setUserProfile(null)
              return
            }
            
            throw error
          }
          
          console.log('🔐 useAuthStore: User profile set successfully')
          get().setUserProfile(profile)
          
          // Also fetch business user role
          await get().fetchBusinessUser(userId)
        } catch (err) {
          console.error('🔐 useAuthStore: Error in fetchUserProfile:', err)
          // Don't throw here to prevent breaking the auth flow
        }
      },
      
      fetchBusinessUser: async (userId: string) => {
        console.log('🔐 useAuthStore: fetchBusinessUser called', { userId })
        
        try {
          // Fetch the user's business role (assuming they have one active business for now)
          // In a multi-business scenario, you'd need to specify which business
          const { data: businessUser, error } = await supabase
            .from('business_users')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle() // Use maybeSingle instead of single to handle no results gracefully
          
          console.log('🔐 useAuthStore: fetchBusinessUser result', { 
            hasBusinessUser: !!businessUser, 
            error: error?.message,
            errorCode: error?.code,
            role: businessUser?.role
          })
          
          // Check if user changed during fetch (race condition protection)
          const currentUser = get().user
          if (!currentUser || currentUser.id !== userId) {
            console.log('🔐 useAuthStore: User changed during business user fetch, aborting')
            return
          }
          
          if (error) {
            console.error('🔐 useAuthStore: Error fetching business user:', error)
            
            // Handle RLS policy errors (406) - user likely has no business association
            if (error.code === 'PGRST301' || error.message?.includes('406')) {
              console.log('🔐 useAuthStore: RLS policy blocked access - user has no business association')
              get().setBusinessUser(null)
              return
            }
            
            // Handle case where business user doesn't exist yet
            if (error.code === 'PGRST116') {
              console.log('🔐 useAuthStore: Business user not found, user may not be part of any business yet')
              get().setBusinessUser(null)
              return
            }
            
            // For other errors, set businessUser to null and continue
            console.log('🔐 useAuthStore: Setting businessUser to null due to error')
            get().setBusinessUser(null)
            return
          }
          
          if (businessUser) {
            console.log('🔐 useAuthStore: Business user set successfully')
            get().setBusinessUser(businessUser)
          } else {
            console.log('🔐 useAuthStore: No business user found, user has no business association')
            get().setBusinessUser(null)
          }
        } catch (err) {
          console.error('🔐 useAuthStore: Error in fetchBusinessUser:', err)
          // Set businessUser to null and continue - don't break the auth flow
          get().setBusinessUser(null)
        }
      },
      
      // Auth methods
      signUp: async (email: string, password: string, metadata?: { full_name?: string }) => {
        console.log('🔐 useAuthStore: signUp called', { email: email.substring(0, 3) + '***', hasMetadata: !!metadata })
        
        const { loading } = get()
        if (loading) {
          console.log('🔐 useAuthStore: Sign-up already in progress, ignoring request')
          return { error: null }
        }
        
        set({ loading: true })
        
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getURL()}auth/callback`,
            data: metadata || {}
          }
        })
        
        console.log('🔐 useAuthStore: signUp result', { 
          hasUser: !!result.data?.user,
          hasSession: !!result.data?.session,
          error: result.error?.message 
        })
        
        set({ loading: false })
        return { error: result.error }
      },
      
      signIn: async (email: string, password: string) => {
        console.log('🔐 useAuthStore: signIn called', { email: email.substring(0, 3) + '***' })
        
        const { loading } = get()
        if (loading) {
          console.log('🔐 useAuthStore: Sign-in already in progress, ignoring request')
          return { error: null }
        }
        
        set({ loading: true })
        
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        console.log('🔐 useAuthStore: signIn result', { 
          hasUser: !!result.data?.user,
          hasSession: !!result.data?.session,
          error: result.error?.message 
        })
        
        set({ loading: false })
        return { error: result.error }
      },
      
      signInWithProvider: async (provider: Provider) => {
        console.log('🔐 useAuthStore: signInWithProvider called', { 
          provider, 
          currentLoading: get().loading,
          oauthLoadingTime: window.localStorage.getItem('oauth_loading_time')
        })
        
        try {
          // Check for stuck OAuth state and reset if needed
          const oauthLoadingTime = window.localStorage.getItem('oauth_loading_time')
          if (oauthLoadingTime) {
            const timeDiff = Date.now() - parseInt(oauthLoadingTime)
            if (timeDiff > 30000) { // 30 seconds
              console.log('🔐 useAuthStore: Resetting stuck loading state')
              set({ loading: false })
              window.localStorage.removeItem('oauth_loading_time')
            }
          }
          
          const { loading } = get()
          if (loading) {
            console.log('🔐 useAuthStore: OAuth already in progress, ignoring request')
            return { error: null }
          }
          
          set({ loading: true })
          window.localStorage.setItem('oauth_loading_time', Date.now().toString())
          
          const redirectUrl = `${getURL()}auth/callback`
          console.log('🔐 useAuthStore: Initiating OAuth flow', { provider, redirectUrl })
          
          const result = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: redirectUrl,
            },
          })
          
          console.log('🔐 useAuthStore: signInWithProvider result', { 
            hasUrl: !!result.data?.url,
            error: result.error?.message,
            errorCode: result.error?.code
          })
          
          if (result.error) {
            console.error('🔐 useAuthStore: OAuth error', { 
              provider, 
              error: result.error.message,
              code: result.error.code,
              details: result.error
            })
            set({ loading: false })
            window.localStorage.removeItem('oauth_loading_time')
            return { error: result.error }
          }
          
          if (!result.data?.url) {
            console.error('🔐 useAuthStore: No OAuth URL returned', { provider })
            set({ loading: false })
            window.localStorage.removeItem('oauth_loading_time')
            return { 
              error: { 
                message: 'Failed to initiate OAuth flow. Please try again.', 
                code: 'OAUTH_NO_URL' 
              } as AuthError 
            }
          }
          
          console.log('🔐 useAuthStore: OAuth flow initiated successfully', { 
            provider, 
            hasUrl: !!result.data.url,
            urlLength: result.data.url?.length,
            redirectUrl: redirectUrl
          })
          
          // For OAuth, we don't set loading to false here as the user will be redirected
          // The loading state will be cleared when the auth state changes or by the timeout mechanism
          return { error: null }
        } catch (err) {
          console.error('🔐 useAuthStore: Unexpected error in signInWithProvider', { 
            provider, 
            error: err,
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
            errorStack: err instanceof Error ? err.stack : undefined
          })
          set({ loading: false })
          window.localStorage.removeItem('oauth_loading_time')
          return { 
            error: { 
              message: `Failed to sign in with ${provider}. Please try again.`, 
              code: 'OAUTH_UNEXPECTED_ERROR' 
            } as AuthError 
          }
        }
      },
      
      signOut: async () => {
        console.log('🔐 useAuthStore: signOut called')
        set({ loading: true })
        const result = await supabase.auth.signOut()
        console.log('🔐 useAuthStore: signOut result', { error: result.error?.message })
        get().setUserProfile(null)
        get().setBusinessUser(null)
        set({ loading: false })
        return { error: result.error }
      },
      
      resetPassword: async (email: string) => {
        console.log('🔐 useAuthStore: resetPassword called', { email: email.substring(0, 3) + '***' })
        const result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${getURL()}auth/reset-password`,
        })
        console.log('🔐 useAuthStore: resetPassword result', { error: result.error?.message })
        return { error: result.error }
      },
      
      updatePassword: async (password: string) => {
        console.log('🔐 useAuthStore: updatePassword called')
        const result = await supabase.auth.updateUser({ password })
        console.log('🔐 useAuthStore: updatePassword result', { 
          hasUser: !!result.data?.user,
          error: result.error?.message 
        })
        return { error: result.error }
      },
      
      resendVerification: async (email: string) => {
        console.log('🔐 useAuthStore: resendVerification called', { email: email.substring(0, 3) + '***' })
        const result = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${getURL()}auth/callback`
          }
        })
        console.log('🔐 useAuthStore: resendVerification result', { error: result.error?.message })
        return { error: result.error }
      },
      
      updateProfile: async (updates: Partial<UserProfile>) => {
        const { user, userProfile } = get()
        if (!user || !userProfile) {
          return { error: 'User not authenticated' }
        }

        console.log('🔐 useAuthStore: updateProfile called', { userId: user.id, updates })
        try {
          const { error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('user_id', user.id)

          console.log('🔐 useAuthStore: updateProfile result', { error: error?.message })

          if (error) throw error

          // Refresh profile data
          await get().fetchUserProfile(user.id)
          return { error: null }
        } catch (err) {
          console.error('🔐 useAuthStore: Error in updateProfile', err)
          const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
          return { error: errorMessage }
        }
      },
      
      refreshProfile: async () => {
        console.log('🔐 useAuthStore: refreshProfile called')
        const { user } = get()
        if (user) {
          // Refresh both user profile and business user data
          await get().fetchUserProfile(user.id)
          await get().fetchBusinessUser(user.id)
          console.log('🔐 useAuthStore: Profile and business data refreshed')
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        userProfile: state.userProfile,
        businessUser: state.businessUser,
        role: state.role,
        isAdmin: state.isAdmin,
        isEmployee: state.isEmployee,
        isManager: state.isManager,
      }),
    }
  )
)

// Utility functions
export const requireAuth = () => {
  const { user } = useAuthStore.getState()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export const requireRole = (requiredRole: string) => {
  const { user, role } = useAuthStore.getState()
  if (!user) {
    throw new Error('Authentication required')
  }
  if (role !== requiredRole) {
    throw new Error(`Role '${requiredRole}' required, but user has role '${role}'`)
  }
  return user
}
