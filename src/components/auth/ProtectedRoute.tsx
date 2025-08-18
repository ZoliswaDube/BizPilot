import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { SessionManager } from '../../lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Handle stuck loading state and trigger background validation
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.log('🔐 ProtectedRoute: Loading timeout reached, checking auth state')
        setLoadingTimeout(true)
        
        // If still loading after 15 seconds, there might be an auth issue
        // Clear any stuck OAuth state and redirect to error page
        const oauthLoadingTime = window.localStorage.getItem('oauth_loading_time')
        if (oauthLoadingTime) {
          const timeDiff = Date.now() - parseInt(oauthLoadingTime)
          if (timeDiff > 15000) {
            console.log('🔐 ProtectedRoute: Clearing stuck OAuth state')
            window.localStorage.removeItem('oauth_loading_time')
            signOut().then(() => {
              navigate('/auth/error?error=Authentication%20Timeout&error_description=Authentication%20took%20too%20long.%20Please%20try%20again.')
            })
            return
          }
        }
        
        // Proactively validate/refresh session
        SessionManager.validateAndRefreshSession().finally(() => {
          // If no user after timeout, redirect to auth error
          if (!user) {
            signOut().then(() => {
              navigate('/auth/error?error=Authentication%20Failed&error_description=Unable%20to%20verify%20your%20authentication.%20Please%20sign%20in%20again.')
            })
          }
        })
      }, 15000) // 15 second timeout

      return () => clearTimeout(timer)
    } else {
      setLoadingTimeout(false)
    }
  }, [loading, user, signOut, navigate])

  if (loading && !loadingTimeout) {
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

  if (loadingTimeout) {
    return <Navigate to="/auth/error?error=Authentication%20Timeout&error_description=Authentication%20took%20too%20long.%20Please%20try%20again." replace />
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}