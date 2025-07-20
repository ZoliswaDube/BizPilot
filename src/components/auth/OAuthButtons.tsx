import { useState, useRef } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface OAuthButtonsProps {
  onSuccess: () => void
}

export function OAuthButtons({ }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [timeoutError, setTimeoutError] = useState(false)
  const { signInWithProvider } = useAuth()
  const timeoutRef = useRef<NodeJS.Timeout>()

  const clearTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    console.log('🔐 OAuthButtons: handleOAuthSignIn called', { provider })
    setLoading(provider)
    setError('')
    setTimeoutError(false)
    
    // Clear any existing timeouts
    clearTimeouts()

    try {
      // Set a timeout for the OAuth process
      timeoutRef.current = setTimeout(() => {
        console.log('🔐 OAuthButtons: OAuth timeout reached', { provider })
        setLoading(null)
        setTimeoutError(true)
        setError(`Sign-in with ${provider} is taking longer than expected. Please try again.`)
      }, 10000) // 10 second timeout

      const { error } = await signInWithProvider(provider)
      console.log('🔐 OAuthButtons: signInWithProvider result', { 
        provider, 
        error: error?.message, 
        hasError: !!error,
        fullError: error 
      })
      
      // Clear the timeout since we got a response
      clearTimeouts()
      
      if (error) {
        console.error('🔐 OAuthButtons: OAuth error', { provider, error })
        
        // Handle specific error cases
        if (error.code === 'AUTH_IN_PROGRESS') {
          setError('Authentication is already in progress. Please wait or refresh the page to try again.')
        } else {
          setError(error.message || `Failed to sign in with ${provider}`)
        }
        setLoading(null)
      } else {
        console.log('🔐 OAuthButtons: OAuth initiated successfully', { provider })
        // For OAuth, the redirect will happen automatically
        // We don't set loading to null here as the user will be redirected
      }
    } catch (err) {
      console.error('🔐 OAuthButtons: Unexpected error in handleOAuthSignIn', { provider, error: err })
      clearTimeouts()
      setLoading(null)
      setError(`Failed to sign in with ${provider}. Please try again.`)
    }
  }

  const handleRetry = (provider: 'google' | 'github') => {
    console.log('🔐 OAuthButtons: Retrying OAuth sign-in', { provider })
    setError('')
    setTimeoutError(false)
    handleOAuthSignIn(provider)
  }

  const handleClearAndRetry = (provider: 'google' | 'github') => {
    console.log('🔐 OAuthButtons: Clearing stuck state and retrying', { provider })
    // Clear any stuck OAuth state
    window.localStorage.removeItem('oauth_loading_time')
    setLoading(null)
    setError('')
    setTimeoutError(false)
    // Small delay to ensure state is cleared
    setTimeout(() => {
      handleOAuthSignIn(provider)
    }, 100)
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Authentication Error</p>
              <p className="text-red-300 mt-1">{error}</p>
              {timeoutError && (
                <p className="text-red-300 text-xs mt-2">
                  This might be due to network issues or high server load.
                </p>
              )}
              {error.includes('already in progress') && (
                <button
                  onClick={() => handleClearAndRetry('google')}
                  className="mt-2 text-xs text-primary-400 hover:text-primary-300 underline"
                >
                  Clear and try again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => handleOAuthSignIn('google')}
        disabled={loading !== null}
        className="w-full flex items-center justify-center px-4 py-2 border border-dark-600 rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'google' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {timeoutError && loading === 'google' && (
        <div className="mt-2">
          <button
            onClick={() => handleRetry('google')}
            className="w-full text-sm text-primary-400 hover:text-primary-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-dark-950 text-gray-500">or</span>
        </div>
      </div>
    </div>
  )
}