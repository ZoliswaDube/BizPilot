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
        window.localStorage.removeItem('oauth_loading_time')
      }
    }
    
    // Set a timeout to ensure loading never gets stuck indefinitely
    const loadingTimeout = setTimeout(() => {
      setLoading(false)
    }, 10000) // 10 second timeout
    
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
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
        } catch {
          // Don't let profile fetch failure block the auth flow
        }
      }
    }).catch(error => {
      clearTimeout(loadingTimeout)
      setLoading(false) // Ensure loading is always set to false
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Handle profile fetching based on session state
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
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
