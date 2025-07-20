import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session, AuthError, Provider } from '@supabase/supabase-js'
import * as Sentry from '@sentry/react'
import { supabase, getURL } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithProvider: (provider: Provider) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  resendVerification: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Clear any stuck OAuth states on initialization
    const oauthLoadingTime = window.localStorage.getItem('oauth_loading_time')
    if (oauthLoadingTime) {
      const timeDiff = Date.now() - parseInt(oauthLoadingTime)
      if (timeDiff > 30000) { // 30 seconds
        console.log('🔐 useAuth: Clearing stuck OAuth state on initialization')
        window.localStorage.removeItem('oauth_loading_time')
      }
    }
    
    // Set a timeout to ensure loading never gets stuck indefinitely
    const loadingTimeout = setTimeout(() => {
      console.log('🔐 useAuth: Loading timeout reached, forcing loading to false')
      setLoading(false)
    }, 10000) // 10 second timeout
    
    // Get initial session
    console.log('🔐 useAuth: Getting initial session')
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('🔐 useAuth: Initial session result', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email
      })
      setSession(session)
      setUser(session?.user ?? null)
      
      // Clear the loading timeout since we got a response
      clearTimeout(loadingTimeout)
      
      // Always set loading to false first to prevent infinite loading
      setLoading(false)
      
      // Then fetch profile in background if user exists
      if (session?.user) {
        try {
          await fetchUserProfile(session.user.id)
        } catch (error) {
          console.error('🔐 useAuth: Error fetching profile during initial session', error)
          // Don't let profile fetch failure block the auth flow
        }
      }
    }).catch(error => {
      console.error('🔐 useAuth: Error getting initial session', error)
      clearTimeout(loadingTimeout)
      setLoading(false) // Ensure loading is always set to false
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 useAuth: Auth state change', { 
        event, 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email?.substring(0, 3) + '***'
      })
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        console.log('🔐 useAuth: Fetching user profile for', session.user.id)
        await fetchUserProfile(session.user.id)
      } else {
        console.log('🔐 useAuth: No session, clearing user profile')
        setUserProfile(null)
      }

      // Set Sentry user context
      if (session?.user) {
        Sentry.setUser({
          id: session.user.id,
          email: session.user.email,
        })
      } else {
        Sentry.setUser(null)
      }

      // Database triggers now handle profile and settings creation automatically
      console.log('🔐 useAuth: Auth state change processed, database triggers handle profile/settings creation')
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    console.log('🔐 useAuth: fetchUserProfile called', { userId })
    
    // Store the current user to check for race conditions
    const currentUser = user
    
    try {
      console.log('🔐 useAuth: Starting profile fetch query...')
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      console.log('🔐 useAuth: fetchUserProfile result', { 
        hasData: !!data, 
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        profileData: data ? {
          id: data.id,
          email: data.email?.substring(0, 3) + '***',
          full_name: data.full_name,
          provider: data.provider,
          email_verified: data.email_verified
        } : null
      })

      // Check for race condition - user might have logged out while we were fetching
      if (currentUser !== user) {
        console.log('🔐 useAuth: User changed during profile fetch, aborting')
        return
      }

      if (error && error.code !== 'PGRST116') {
        console.error('🔐 useAuth: Error fetching user profile:', error)
        setUserProfile(null)
        return
      }

      if (error && error.code === 'PGRST116') {
        console.log('🔐 useAuth: Profile not found (PGRST116), database triggers will handle creation')
        setUserProfile(null)
        return
      }

      setUserProfile(data)
      console.log('🔐 useAuth: User profile set successfully')
    } catch (err) {
      console.error('🔐 useAuth: Error in fetchUserProfile:', err)
      // Don't let profile fetch failure break the auth flow
      setUserProfile(null)
    }
  }

  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
    console.log('🔐 useAuth: signUp called', { email: email.substring(0, 3) + '***', hasMetadata: !!metadata })
    
    // Prevent multiple simultaneous sign-up attempts
    if (loading) {
      console.log('🔐 useAuth: Sign-up already in progress, ignoring request')
      return { error: { message: 'Sign-up already in progress', code: 'AUTH_IN_PROGRESS' } as AuthError }
    }
    
    setLoading(true)
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/callback`,
          data: metadata || {}
        }
      })
      console.log('🔐 useAuth: signUp result', { 
        hasUser: !!result.data?.user,
        hasSession: !!result.data?.session,
        error: result.error?.message,
        errorCode: result.error?.code,
        userId: result.data?.user?.id
      })
      return { error: result.error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 useAuth: signIn called', { email: email.substring(0, 3) + '***' })
    
    // Prevent multiple simultaneous sign-in attempts
    if (loading) {
      console.log('🔐 useAuth: Sign-in already in progress, ignoring request')
      return { error: { message: 'Sign-in already in progress', code: 'AUTH_IN_PROGRESS' } as AuthError }
    }
    
    setLoading(true)
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      console.log('🔐 useAuth: signIn result', { 
        hasUser: !!result.data?.user,
        hasSession: !!result.data?.session,
        error: result.error?.message,
        errorCode: result.error?.code,
        userId: result.data?.user?.id
      })
      return { error: result.error }
    } finally {
      setLoading(false)
    }
  }

  const signInWithProvider = async (provider: Provider) => {
    const redirectUrl = `${getURL()}auth/callback`
    console.log('🔐 useAuth: signInWithProvider called', { 
      provider, 
      redirectUrl,
      currentUser: user?.id,
      hasSession: !!session,
      currentLocation: window.location.href,
      isDevelopment: import.meta.env.DEV
    })
    
    // Reset loading state if it's been stuck for too long (more than 30 seconds)
    const now = Date.now()
    const lastLoadingTime = window.localStorage.getItem('oauth_loading_time')
    if (loading && lastLoadingTime && (now - parseInt(lastLoadingTime)) > 30000) {
      console.log('🔐 useAuth: Resetting stuck loading state')
      setLoading(false)
      window.localStorage.removeItem('oauth_loading_time')
    }
    
    // Prevent multiple simultaneous OAuth attempts
    if (loading) {
      console.log('🔐 useAuth: OAuth already in progress, ignoring request')
      return { error: { message: 'OAuth already in progress', code: 'AUTH_IN_PROGRESS' } as AuthError }
    }
    
    setLoading(true)
    window.localStorage.setItem('oauth_loading_time', now.toString())
    
    try {
      console.log('🔐 useAuth: Initiating OAuth flow', { provider, redirectUrl })
      
      const result = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      
      console.log('🔐 useAuth: signInWithProvider result', { 
        provider,
        hasData: !!result.data,
        hasUrl: !!result.data?.url,
        error: result.error?.message,
        errorCode: result.error?.code,
        url: result.data?.url ? 'present' : 'missing',
        redirectUrl: redirectUrl
      })
      
      if (result.error) {
        console.error('🔐 useAuth: OAuth error', { 
          provider, 
          error: result.error,
          message: result.error.message,
          code: result.error.code 
        })
        setLoading(false)
        window.localStorage.removeItem('oauth_loading_time')
        return { error: result.error }
      }
      
      if (!result.data?.url) {
        console.error('🔐 useAuth: No OAuth URL returned', { provider })
        setLoading(false)
        window.localStorage.removeItem('oauth_loading_time')
        return { 
          error: { 
            message: 'Failed to initiate OAuth flow. Please try again.', 
            code: 'OAUTH_NO_URL' 
          } as AuthError 
        }
      }
      
      console.log('🔐 useAuth: OAuth flow initiated successfully', { 
        provider, 
        hasUrl: !!result.data.url,
        urlLength: result.data.url?.length,
        redirectUrl: redirectUrl
      })
      
      // For OAuth, we don't set loading to false here as the user will be redirected
      // The loading state will be cleared when the auth state changes or by the timeout mechanism
      return { error: null }
    } catch (err) {
      console.error('🔐 useAuth: Unexpected error in signInWithProvider', { 
        provider, 
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : undefined
      })
      setLoading(false)
      window.localStorage.removeItem('oauth_loading_time')
      return { 
        error: { 
          message: `Failed to sign in with ${provider}. Please try again.`, 
          code: 'OAUTH_UNEXPECTED_ERROR' 
        } as AuthError 
      }
    }
  }

  const signOut = async () => {
    console.log('🔐 useAuth: signOut called')
    setLoading(true)
    const result = await supabase.auth.signOut()
    console.log('🔐 useAuth: signOut result', { error: result.error?.message })
    setUserProfile(null)
    setLoading(false)
    return { error: result.error }
  }

  const resetPassword = async (email: string) => {
    console.log('🔐 useAuth: resetPassword called', { email: email.substring(0, 3) + '***' })
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getURL()}auth/reset-password`,
    })
    console.log('🔐 useAuth: resetPassword result', { error: result.error?.message })
    return { error: result.error }
  }

  const updatePassword = async (password: string) => {
    console.log('🔐 useAuth: updatePassword called')
    const result = await supabase.auth.updateUser({ password })
    console.log('🔐 useAuth: updatePassword result', { 
      hasUser: !!result.data?.user,
      error: result.error?.message 
    })
    return { error: result.error }
  }

  const resendVerification = async (email: string) => {
    console.log('🔐 useAuth: resendVerification called', { email: email.substring(0, 3) + '***' })
    const result = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${getURL()}auth/callback`
      }
    })
    console.log('🔐 useAuth: resendVerification result', { error: result.error?.message })
    return { error: result.error }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) {
      return { error: 'User not authenticated' }
    }

    console.log('🔐 useAuth: updateProfile called', { userId: user.id, updates })
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)

      console.log('🔐 useAuth: updateProfile result', { error: error?.message })

      if (error) throw error

      // Refresh profile data
      await fetchUserProfile(user.id)
      return { error: null }
    } catch (err) {
      console.error('🔐 useAuth: Error in updateProfile', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      return { error: errorMessage }
    }
  }

  const refreshProfile = async () => {
    console.log('🔐 useAuth: refreshProfile called')
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  return {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    resendVerification,
    updateProfile,
    refreshProfile,
  }
}