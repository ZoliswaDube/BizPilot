import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session, AuthError, Provider } from '@supabase/supabase-js'
import * as Sentry from '@sentry/react'
import { supabase, getURL } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type UserProfile = Database['public']['Tables']['profiles']['Row']

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
    // Get initial session
    console.log('🔐 useAuth: Getting initial session')
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 useAuth: Initial session result', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email
      })
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
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

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    console.log('🔐 useAuth: fetchUserProfile called', { userId })
    try {
      console.log('🔐 useAuth: Starting profile fetch query...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
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
          role: data.role,
          phone: data.phone
        } : null
      })

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
    setLoading(true)
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
    setLoading(false)
    return { error: result.error }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 useAuth: signIn called', { email: email.substring(0, 3) + '***' })
    setLoading(true)
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
    setLoading(false)
    return { error: result.error }
  }

  const signInWithProvider = async (provider: Provider) => {
    console.log('🔐 useAuth: signInWithProvider called', { provider, redirectTo: `${getURL()}auth/callback` })
    setLoading(true)
    const result = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getURL()}auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    console.log('🔐 useAuth: signInWithProvider result', { 
      provider,
      hasData: !!result.data,
      error: result.error?.message,
      errorCode: result.error?.code,
      url: result.data?.url ? 'present' : 'missing'
    })
    setLoading(false)
    return { error: result.error }
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
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

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