import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { SessionManager } from '../../lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, setLoading } = useAuthStore()
  const navigate = useNavigate()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  // Handle stuck loading state (only on initial load, not during signOut)
  useEffect(() => {
    // Mark as no longer initial load after first render
    if (initialLoad) {
      const timer = setTimeout(() => {
        setInitialLoad(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [initialLoad])

  useEffect(() => {
    // Only apply timeout logic during initial authentication check
    // Not during normal operations like signOut
    if (loading && initialLoad) {
      const timer = setTimeout(() => {
        console.log('🔐 ProtectedRoute: Initial loading timeout reached')
        setLoadingTimeout(true)
        
        // Clear stuck OAuth state
        const oauthLoadingTime = window.localStorage.getItem('oauth_loading_time')
        if (oauthLoadingTime) {
          const timeDiff = Date.now() - parseInt(oauthLoadingTime)
          if (timeDiff > 15000) {
            console.log('🔐 ProtectedRoute: Clearing stuck OAuth state')
            window.localStorage.removeItem('oauth_loading_time')
          }
        }
        
        // Validate session
        SessionManager.validateAndRefreshSession().finally(() => {
          setLoadingTimeout(false)
          setLoading(false)
        })
      }, 15000) // 15 second timeout

      return () => clearTimeout(timer)
    }
  }, [loading, initialLoad])

  // Show loading only during initial authentication check
  if (loading && initialLoad && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
          <p className="mt-1 text-sm text-gray-500">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // If no user and not loading, redirect to home (not error page)
  if (!user && !loading) {
    console.log('🔐 ProtectedRoute: No user, redirecting to home')
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}