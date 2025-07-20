import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

export function AuthInitializer() {
  const { 
    setUser, 
    setSession, 
    setLoading, 
    setUserProfile,
    setBusinessUser,
    fetchUserProfile 
  } = useAuthStore()

  useEffect(() => {
    // Clear any stuck OAuth states on initialization
    const oauthLoadingTime = window.localStorage.getItem('oauth_loading_time')
    if (oauthLoadingTime) {
      const timeDiff = Date.now() - parseInt(oauthLoadingTime)
      if (timeDiff > 30000) { // 30 seconds
        console.log('🔐 AuthInitializer: Clearing stuck OAuth state on initialization')
        window.localStorage.removeItem('oauth_loading_time')
      }
    }
    
    // Set a timeout to ensure loading never gets stuck indefinitely
    const loadingTimeout = setTimeout(() => {
      console.log('🔐 AuthInitializer: Loading timeout reached, forcing loading to false')
      setLoading(false)
    }, 10000) // 10 second timeout
    
    // Get initial session
    console.log('🔐 AuthInitializer: Getting initial session')
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('🔐 AuthInitializer: Initial session result', { 
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
          console.error('🔐 AuthInitializer: Error fetching profile during initial session', error)
          // Don't let profile fetch failure block the auth flow
        }
      }
    }).catch(error => {
      console.error('🔐 AuthInitializer: Error getting initial session', error)
      clearTimeout(loadingTimeout)
      setLoading(false) // Ensure loading is always set to false
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 AuthInitializer: Auth state change', { 
        event, 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email?.substring(0, 3) + '***'
      })
      
      setSession(session)
      setUser(session?.user ?? null)
      
      // Handle profile fetching based on session state
      if (session?.user) {
        console.log('🔐 AuthInitializer: Fetching user profile for', session.user.id)
        await fetchUserProfile(session.user.id)
      } else {
        console.log('🔐 AuthInitializer: No session, clearing user profile and business user')
        setUserProfile(null)
        setBusinessUser(null)
      }
      
      // Clear OAuth loading state on successful auth state change
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        window.localStorage.removeItem('oauth_loading_time')
        setLoading(false)
      }
      
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        window.localStorage.removeItem('oauth_loading_time')
        setLoading(false)
      }
      
      console.log('🔐 AuthInitializer: Auth state change processed, database triggers handle profile/settings creation')
    })

    // Cleanup function
    return () => {
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [setUser, setSession, setLoading, setUserProfile, setBusinessUser, fetchUserProfile])

  // This component doesn't render anything
  return null
}
