import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Session, AuthError, Provider } from '@supabase/supabase-js'
import * as Sentry from '@sentry/react'
import { supabase } from '../lib/supabase'
import { ensureUserProfile } from '../lib/mcp'
import { inactivityService } from '../services/inactivityService'
import type { Database } from '../lib/supabase'
import { 
  authConfig, 
  getAuthCallbackPath, 
  getPasswordResetPath,
  clearAuthStorage,
  isOAuthStuck,
  resetOAuthState,
  markOAuthStarted,
  markOAuthCompleted,
  logAuth
} from '../config/auth'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type BusinessUser = Database['public']['Tables']['business_users']['Row']

interface AuthState {
  // Core state
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  businessUser: BusinessUser | null
  loading: boolean
  
  // Inactivity state
  showInactivityWarning: boolean
  inactivityTimeRemaining: number
  
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
  
  // Inactivity actions
  startInactivityTracking: () => void
  stopInactivityTracking: () => void
  extendSession: () => void
  handleInactivityTimeout: () => Promise<void>
  setInactivityWarning: (show: boolean, timeRemaining?: number) => void
  
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
      
      // Inactivity state
      showInactivityWarning: false,
      inactivityTimeRemaining: 0,
      
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
        try {
          
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()
          
          // Check if user changed during fetch (race condition protection)
          const currentUser = get().user
          if (!currentUser || currentUser.id !== userId) {
            return
          }
          
          if (error) {
            // Handle case where profile doesn't exist yet (PGRST116 = no rows returned)
            if (error.code === 'PGRST116') {
              get().setUserProfile(null)
              return
            }
            
            throw error
          }
          get().setUserProfile(profile)
          
          // Also fetch business user role
          await get().fetchBusinessUser(userId)
        } catch (err) {
          console.error('🔐 useAuthStore: Error in fetchUserProfile:', err)
          // Don't throw here to prevent breaking the auth flow
        }
      },
      
      fetchBusinessUser: async (userId: string) => {
        try {
          // Fetch the user's business role (assuming they have one active business for now)
          // In a multi-business scenario, you'd need to specify which business
          const { data: businessUser, error } = await supabase
            .from('business_users')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle() // Use maybeSingle instead of single to handle no results gracefully
          
          // Check if user changed during fetch (race condition protection)
          const currentUser = get().user
          if (!currentUser || currentUser.id !== userId) {
            return
          }
          
          if (error) {
            // Handle RLS policy errors (406) - user likely has no business association
            if (error.code === 'PGRST301' || error.message?.includes('406')) {
              get().setBusinessUser(null)
              return
            }
            
            // Handle case where business user doesn't exist yet
            if (error.code === 'PGRST116') {
              get().setBusinessUser(null)
              return
            }
            
            // For other errors, set businessUser to null and continue
            get().setBusinessUser(null)
            return
          }
          
          if (businessUser) {
            get().setBusinessUser(businessUser)
          } else {
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
        logAuth('signUp called', { email: email.substring(0, 3) + '***', hasMetadata: !!metadata })
        
        const { loading } = get()
        if (loading) {
          logAuth('Sign-up already in progress, ignoring request')
          return { error: null }
        }
        
        set({ loading: true })
        
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getAuthCallbackPath(),
            data: metadata || {}
          }
        })
        
        logAuth('signUp result', { 
          hasUser: !!result.data?.user,
          hasSession: !!result.data?.session,
          error: result.error?.message 
        })
        
        // If user is created, persist profile via MCP (or fallback)
        try {
          const createdUser = result.data?.user
          if (createdUser) {
            await ensureUserProfile(
              createdUser.id,
              createdUser.email ?? email,
              metadata?.full_name ?? createdUser.user_metadata?.full_name ?? null,
              createdUser.app_metadata?.provider ?? 'email'
            )
          }
        } catch (profileErr) {
          console.warn('Failed to upsert user profile after signup:', profileErr)
        }

        set({ loading: false })
        return { error: result.error }
      },
      
      signIn: async (email: string, password: string) => {
        logAuth('signIn called', { email: email.substring(0, 3) + '***' })
        
        const { loading } = get()
        if (loading) {
          logAuth('Sign-in already in progress, ignoring request')
          return { error: null }
        }
        
        set({ loading: true })
        
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        logAuth('signIn result', { 
          hasUser: !!result.data?.user,
          hasSession: !!result.data?.session,
          error: result.error?.message 
        })
        
        // Start inactivity tracking on successful sign-in
        if (result.data?.user && result.data?.session && !result.error) {
          logAuth('Starting inactivity tracking after successful sign-in')
          get().startInactivityTracking()
        }
        
        set({ loading: false })
        return { error: result.error }
      },
      
      signInWithProvider: async (provider: Provider) => {
        logAuth('signInWithProvider called', { 
          provider, 
          currentLoading: get().loading,
          oauthLoadingTime: window.localStorage.getItem(authConfig.storageKeys.oauthLoadingTime)
        })
        
        try {
          // Check for stuck OAuth state and reset if needed
          if (isOAuthStuck()) {
            logAuth('Resetting stuck OAuth state')
            set({ loading: false })
            resetOAuthState()
          }
          
          const { loading } = get()
          if (loading) {
            logAuth('OAuth already in progress, ignoring request')
            return { error: null }
          }
          
          set({ loading: true })
          markOAuthStarted()
          
          const redirectUrl = getAuthCallbackPath()
          logAuth('Initiating OAuth flow', { provider, redirectUrl })
          
          const result = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: redirectUrl,
            },
          })
          
          logAuth('signInWithProvider result', { 
            hasUrl: !!result.data?.url,
            error: result.error?.message,
            errorCode: result.error?.code
          })
          
          if (result.error) {
            logAuth('OAuth error', { 
              provider, 
              error: result.error.message,
              code: result.error.code,
              details: result.error
            })
            set({ loading: false })
            markOAuthCompleted()
            return { error: result.error }
          }
          
          if (!result.data?.url) {
            logAuth('No OAuth URL returned', { provider })
            set({ loading: false })
            markOAuthCompleted()
            return { 
              error: { 
                message: authConfig.errors.oauthFailed, 
                code: 'OAUTH_NO_URL' 
              } as AuthError 
            }
          }
          
          logAuth('OAuth flow initiated successfully', { 
            provider, 
            hasUrl: !!result.data.url,
            urlLength: result.data.url?.length,
            redirectUrl: redirectUrl
          })
          
          // For OAuth, we don't set loading to false here as the user will be redirected
          // The loading state will be cleared when the auth state changes or by the timeout mechanism
          return { error: null }
        } catch (err) {
          logAuth('Unexpected error in signInWithProvider', { 
            provider, 
            error: err,
            errorMessage: err instanceof Error ? err.message : 'Unknown error'
          })
          set({ loading: false })
          markOAuthCompleted()
          return { 
            error: { 
              message: `Failed to sign in with ${provider}. Please try again.`, 
              code: 'OAUTH_UNEXPECTED_ERROR' 
            } as AuthError 
          }
        }
      },
      
      signOut: async () => {
        logAuth('signOut called')
        
        try {
          // Stop inactivity tracking FIRST
          get().stopInactivityTracking()
          
          // Clear local state immediately to prevent UI flicker
          get().setUserProfile(null)
          get().setBusinessUser(null)
          set({ 
            user: null, 
            session: null,
            loading: false 
          })
          
          // Sign out from Supabase
          const result = await supabase.auth.signOut()
          logAuth('signOut result', { error: result.error?.message })
          
          return { error: result.error }
        } catch (error) {
          logAuth('Error during signOut', error)
          // Even if signOut fails, clear local state
          get().setUserProfile(null)
          get().setBusinessUser(null)
          set({ 
            user: null, 
            session: null,
            loading: false 
          })
          return { error: error as any }
        }
      },
      
      resetPassword: async (email: string) => {
        logAuth('resetPassword called', { email: email.substring(0, 3) + '***' })
        const result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getPasswordResetPath(),
        })
        logAuth('resetPassword result', { error: result.error?.message })
        return { error: result.error }
      },
      
      updatePassword: async (password: string) => {
        logAuth('updatePassword called')
        const result = await supabase.auth.updateUser({ password })
        logAuth('updatePassword result', { 
          hasUser: !!result.data?.user,
          error: result.error?.message 
        })
        return { error: result.error }
      },
      
      resendVerification: async (email: string) => {
        logAuth('resendVerification called', { email: email.substring(0, 3) + '***' })
        const result = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: getAuthCallbackPath()
          }
        })
        logAuth('resendVerification result', { error: result.error?.message })
        return { error: result.error }
      },
      
      updateProfile: async (updates: Partial<UserProfile>) => {
        const { user, userProfile } = get()
        if (!user || !userProfile) {
          return { error: 'User not authenticated' }
        }

        logAuth('updateProfile called', { userId: user.id, updates })
        try {
          const { error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('user_id', user.id)

          logAuth('updateProfile result', { error: error?.message })

          if (error) throw error

          // Refresh profile data
          await get().fetchUserProfile(user.id)
          return { error: null }
        } catch (err) {
          logAuth('Error in updateProfile', err)
          const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
          return { error: errorMessage }
        }
      },
      
      refreshProfile: async () => {
        logAuth('refreshProfile called')
        const { user } = get()
        if (user) {
          // Refresh both user profile and business user data
          await get().fetchUserProfile(user.id)
          await get().fetchBusinessUser(user.id)
          logAuth('Profile and business data refreshed')
        }
      },

      // Inactivity methods
      startInactivityTracking: () => {
        logAuth('Starting inactivity tracking')
        
        inactivityService.setCallbacks({
          onTimeout: () => {
            get().handleInactivityTimeout()
          },
          onWarning: () => {
            const timeRemaining = inactivityService.getTimeUntilTimeout()
            logAuth('Inactivity warning triggered', { timeRemaining })
            get().setInactivityWarning(true, timeRemaining)
          },
          onActivity: () => {
            // Reset warning if user becomes active
            const { showInactivityWarning } = get()
            if (showInactivityWarning) {
              get().setInactivityWarning(false, 0)
            }
          }
        })
        
        inactivityService.start()
      },

      stopInactivityTracking: () => {
        logAuth('Stopping inactivity tracking')
        inactivityService.stop()
        set({ 
          showInactivityWarning: false,
          inactivityTimeRemaining: 0
        })
      },

      extendSession: () => {
        logAuth('Extending session - resetting inactivity timer')
        inactivityService.reset()
        set({ 
          showInactivityWarning: false,
          inactivityTimeRemaining: 0
        })
      },

      handleInactivityTimeout: async () => {
        logAuth('Handling inactivity timeout - forcing logout')
        
        // Clear warning state first
        set({ 
          showInactivityWarning: false,
          inactivityTimeRemaining: 0
        })
        
        // Stop inactivity tracking
        get().stopInactivityTracking()
        
        // Force logout
        await get().signOut()
        
        // Clear Supabase auth completely using centralized function
        try {
          await supabase.auth.signOut({ scope: 'global' })
          clearAuthStorage()
        } catch (error) {
          logAuth('Error clearing sessions', error)
        }
        
        // Redirect to login with timeout message
        window.location.href = '/auth?reason=inactivity'
      },

      setInactivityWarning: (show: boolean, timeRemaining = 0) => {
        set({ 
          showInactivityWarning: show,
          inactivityTimeRemaining: timeRemaining
        })
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
