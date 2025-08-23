import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Logo } from '../common/Logo'

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'timeout'>('loading')
  const [message, setMessage] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [showRetry, setShowRetry] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const retryTimeoutRef = useRef<NodeJS.Timeout>()
  const isNavigatingRef = useRef(false)

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  const handleTimeout = () => {
    console.log(' AuthCallback: Timeout reached, showing retry option')
    setStatus('timeout')
    setMessage('Authentication is taking longer than expected.')
    setShowRetry(true)
    // Clear stale OAuth loading flag and auto-redirect to avoid hanging UI
    try { window.localStorage.removeItem('oauth_loading_time') } catch {}
    setTimeout(() => {
      if (!isNavigatingRef.current) {
        isNavigatingRef.current = true
        navigate('/auth/error?error=Authentication%20Timeout&error_description=Authentication%20took%20too%20long.%20Please%20try%20again.')
      }
    }, 4000)
  }

  const handleRetry = () => {
    console.log(' AuthCallback: Retrying authentication')
    setStatus('loading')
    setMessage('')
    setShowRetry(false)
    setRetryCount(prev => prev + 1)
    
    // Clear any existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    
    // Start the auth process again
    handleAuthCallback()
  }

  const handleAuthCallback = async () => {
    console.log('🔐 AuthCallback: handleAuthCallback started')
    
    // Set a timeout for the entire auth process
    timeoutRef.current = setTimeout(handleTimeout, 15000) // Increased to 15 second timeout
    
    try {
      // Wait a brief moment for OAuth state to settle
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if we already have a session (user might be already authenticated)
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      if (existingSession) {
        console.log('🔐 AuthCallback: User already has a session, redirecting to dashboard')
        clearTimeout(timeoutRef.current!)
        setStatus('success')
        setMessage('Welcome back! Redirecting...')
        // Clean up URL and redirect
        window.history.replaceState({}, document.title, window.location.pathname)
        setTimeout(() => navigate('/dashboard'), 500)
        return
      }
      
      // If no tokens or code found, wait a bit and check session again
      console.log('🔐 AuthCallback: No OAuth tokens or code found, waiting and checking session...')
      
      // Wait for potential async auth state changes (increased wait time)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const { data: { session: finalSession } } = await supabase.auth.getSession()
      if (finalSession) {
        console.log('🔐 AuthCallback: Found session after waiting, redirecting to dashboard')
        clearTimeout(timeoutRef.current!)
        setStatus('success')
        setMessage('Authentication successful! Redirecting...')
        // Clean up URL and redirect with delay
        window.history.replaceState({}, document.title, window.location.pathname)
        setTimeout(() => navigate('/dashboard'), 500)
        return
      }
      
      // Final fallback: wait longer and check one more time
      console.log('🔐 AuthCallback: Final fallback - waiting longer for session')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const { data: { session: lastSession } } = await supabase.auth.getSession()
      if (lastSession) {
        console.log('🔐 AuthCallback: Found session in final fallback, redirecting to dashboard')
        clearTimeout(timeoutRef.current!)
        setStatus('success')
        setMessage('Authentication successful! Redirecting...')
        window.history.replaceState({}, document.title, window.location.pathname)
        setTimeout(() => navigate('/dashboard'), 500)
        return
      }
      
      // First, check if we have URL fragments (for implicit flow OAuth)
      const hash = window.location.hash
      const hashParams = new URLSearchParams(hash.replace('#', ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const error = hashParams.get('error')
      const errorDescription = hashParams.get('error_description')
      
      // Also check URL search params (for PKCE flow)
      const code = searchParams.get('code')
      const searchError = searchParams.get('error')
      const searchErrorDescription = searchParams.get('error_description')
      
      console.log('🔐 AuthCallback: All params', { 
        hashParams: Object.fromEntries(hashParams.entries()),
        searchParams: Object.fromEntries(searchParams.entries()),
        hasAccessToken: !!accessToken,
        hasCode: !!code,
        hasError: !!(error || searchError),
        retryCount
      })

      // Check for errors first
      if (error || searchError) {
        console.log('🔐 AuthCallback: Error in params', { 
          error: error || searchError, 
          errorDescription: errorDescription || searchErrorDescription 
        })
        clearTimeout(timeoutRef.current!)
        
        // Redirect to error page with error details
        const errorParams = new URLSearchParams({
          error: error || searchError || 'Authentication failed',
          error_description: errorDescription || searchErrorDescription || 'An unexpected error occurred during authentication.',
          error_code: 'OAUTH_ERROR'
        })
        navigate(`/auth/error?${errorParams.toString()}`)
        return
      }

      // Handle OAuth implicit flow (access_token in URL fragment)
      if (accessToken && refreshToken) {
        console.log('🔐 AuthCallback: Handling OAuth implicit flow with access token')
        
        try {
          // Clear timeout immediately since we're processing
          clearTimeout(timeoutRef.current!)
          
          // Manually set the session using the access token
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          console.log('🔐 AuthCallback: setSession result', { 
            hasSession: !!data.session, 
            hasUser: !!data.user,
            error: error?.message,
            userId: data.session?.user?.id
          })
          
          if (error) {
            console.error('🔐 AuthCallback: Error setting session', error)
            
            // Redirect to error page
            const errorParams = new URLSearchParams({
              error: 'Failed to establish session',
              error_description: error.message || 'The authentication session could not be established.',
              error_code: 'SESSION_ERROR'
            })
            navigate(`/auth/error?${errorParams.toString()}`)
            return
          }

          if (data.session) {
            console.log('🔐 AuthCallback: Session set successfully, redirecting to dashboard')
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')
            
            // Clear the URL fragments to clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname)
            
            // Redirect immediately instead of waiting
            navigate('/dashboard')
          } else {
            console.log('🔐 AuthCallback: No session after setSession, redirecting to login')
            setStatus('error')
            setMessage('No session found. Please try logging in again.')
            setTimeout(() => {
              navigate('/auth')
            }, 2000)
          }
        } catch (err) {
          console.error('🔐 AuthCallback: Error in OAuth flow', err)
          
          // Redirect to error page
          const errorParams = new URLSearchParams({
            error: 'OAuth authentication failed',
            error_description: 'Failed to complete the OAuth authentication process.',
            error_code: 'OAUTH_FLOW_ERROR'
          })
          navigate(`/auth/error?${errorParams.toString()}`)
        }
        return
      }

      // Handle PKCE flow (authorization code)
      if (code) {
        console.log('🔐 AuthCallback: Handling PKCE flow with authorization code')
        
        try {
          // Clear timeout immediately since we're processing
          clearTimeout(timeoutRef.current!)
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          console.log('🔐 AuthCallback: exchangeCodeForSession result', { 
            hasSession: !!data.session, 
            hasUser: !!data.user,
            error: error?.message,
            fullError: error,
            sessionData: data.session ? {
              access_token: data.session.access_token ? 'present' : 'missing',
              refresh_token: data.session.refresh_token ? 'present' : 'missing',
              expires_at: data.session.expires_at,
              user_id: data.session.user?.id
            } : null
          })
          
          if (error) {
            console.error('🔐 AuthCallback: Error exchanging code for session', error)
            
            // Redirect to error page
            const errorParams = new URLSearchParams({
              error: 'Authentication failed',
              error_description: error.message || 'Failed to complete the authentication process.',
              error_code: 'CODE_EXCHANGE_ERROR'
            })
            navigate(`/auth/error?${errorParams.toString()}`)
            return
          }

          if (data.session) {
            console.log('🔐 AuthCallback: Session received from code exchange, redirecting to dashboard')
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')
            // Redirect immediately instead of waiting
            navigate('/dashboard')
          } else {
            console.log('🔐 AuthCallback: No session after code exchange')
            setStatus('error')
            setMessage('Failed to establish session. Please try again.')
            retryTimeoutRef.current = setTimeout(() => {
              navigate('/auth')
            }, 3000)
          }
        } catch (err) {
          console.error('🔐 AuthCallback: Error in PKCE flow', err)
          
          // Redirect to error page
          const errorParams = new URLSearchParams({
            error: 'Authentication failed',
            error_description: 'Failed to complete the authentication process.',
            error_code: 'PKCE_FLOW_ERROR'
          })
          navigate(`/auth/error?${errorParams.toString()}`)
        }
        return
      }

      // Handle email verification or password reset
      const type = searchParams.get('type')
      const tokenHash = searchParams.get('token_hash')
      
      console.log('🔐 AuthCallback: Handling email verification/password reset', { type, hasTokenHash: !!tokenHash })
      
      if (type && tokenHash) {
        try {
          // Handle email verification with token hash
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any
          })

          if (verifyError) {
            console.error('🔐 AuthCallback: Error verifying token hash', verifyError)
            clearTimeout(timeoutRef.current!)
            
            // Redirect to error page
            const errorParams = new URLSearchParams({
              error: 'Failed to verify email',
              error_description: verifyError.message || 'The email verification process failed.',
              error_code: 'VERIFICATION_ERROR'
            })
            navigate(`/auth/error?${errorParams.toString()}`)
            return
          }

          if (type === 'email_change' || type === 'signup') {
            console.log('🔐 AuthCallback: Email verification successful')
            clearTimeout(timeoutRef.current!)
            setStatus('success')
            setMessage('Email verified successfully! You can now sign in.')
            setTimeout(() => {
              navigate('/auth')
            }, 3000)
          } else if (type === 'recovery') {
            console.log('🔐 AuthCallback: Password recovery verification successful')
            clearTimeout(timeoutRef.current!)
            setStatus('success')
            setMessage('Password reset verified! You can now set a new password.')
            setTimeout(() => {
              navigate('/auth/reset-password')
            }, 2000)
          }
          return
        } catch (err) {
          console.error('🔐 AuthCallback: Error in email verification', err)
          clearTimeout(timeoutRef.current!)
          
          // Redirect to error page
          const errorParams = new URLSearchParams({
            error: 'Email verification failed',
            error_description: 'Failed to verify your email address.',
            error_code: 'EMAIL_VERIFICATION_ERROR'
          })
          navigate(`/auth/error?${errorParams.toString()}`)
          return
        }
      }

      // If we get here, something unexpected happened
      console.log('🔐 AuthCallback: No valid params found, checking session')
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('🔐 AuthCallback: Error getting session:', sessionError)
          clearTimeout(timeoutRef.current!)
          
          // Redirect to error page
          const errorParams = new URLSearchParams({
            error: 'Failed to verify authentication',
            error_description: sessionError.message || 'Unable to verify your authentication status.',
            error_code: 'SESSION_CHECK_ERROR'
          })
          navigate(`/auth/error?${errorParams.toString()}`)
          return
        }
        
        if (session) {
          console.log('🔐 AuthCallback: Existing session found, redirecting to dashboard')
          clearTimeout(timeoutRef.current!)
          setStatus('success')
          setMessage('Welcome back! Redirecting...')
          setTimeout(() => {
            navigate('/dashboard')
          }, 1000)
        } else {
          console.log('🔐 AuthCallback: No session found, redirecting to auth')
          clearTimeout(timeoutRef.current!)
          setStatus('error')
          setMessage('Authentication failed. Please try again.')
          retryTimeoutRef.current = setTimeout(() => {
            navigate('/auth')
          }, 3000)
        }
      } catch (err) {
        console.error('🔐 AuthCallback: Error checking session', err)
        clearTimeout(timeoutRef.current!)
        
        // Redirect to error page
        const errorParams = new URLSearchParams({
          error: 'Session verification failed',
          error_description: 'Failed to verify your authentication session.',
          error_code: 'SESSION_CHECK_ERROR'
        })
        navigate(`/auth/error?${errorParams.toString()}`)
      }
    } catch (err) {
      console.error('🔐 AuthCallback: Unexpected error in handleAuthCallback', err)
      clearTimeout(timeoutRef.current!)
      
      // Redirect to error page
      const errorParams = new URLSearchParams({
        error: 'Unexpected error',
        error_description: 'An unexpected error occurred during authentication.',
        error_code: 'UNEXPECTED_ERROR'
      })
      navigate(`/auth/error?${errorParams.toString()}`)
    }
  }

  useEffect(() => {
    console.log('🔐 AuthCallback: Component mounted', {
      currentUrl: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      hostname: window.location.hostname,
      port: window.location.port
    })
    
    // Simple, direct approach: just check for session and redirect
    const checkSessionAndRedirect = async () => {
      console.log('🔐 AuthCallback: Starting simple session check')
      
      try {
        // Wait a moment for OAuth to complete
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Check for session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('🔐 AuthCallback: Session found, redirecting to dashboard')
          setStatus('success')
          setMessage('Authentication successful! Redirecting...')
          
          // Clean up URL
          window.history.replaceState({}, document.title, '/auth/callback')
          
          // Redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard', { replace: true })
          }, 1000)
        } else {
          console.log('🔐 AuthCallback: No session found, falling back to complex handling')
          handleAuthCallback()
        }
      } catch (error) {
        console.error('🔐 AuthCallback: Error in simple session check', error)
        handleAuthCallback()
      }
    }
    
    checkSessionAndRedirect()
  }, [navigate, searchParams, retryCount])

  const handleManualRetry = () => {
    console.log('🔐 AuthCallback: Manual retry requested')
    navigate('/auth')
  }

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-dark-950 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="max-w-md w-full text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
      >
        <div className="bg-dark-900 rounded-xl shadow-xl border border-dark-700 p-8">
          <motion.div 
            className="mx-auto flex justify-center mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Logo width={48} height={48} className="shadow-lg" />
          </motion.div>

          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-8 w-8 mx-auto text-primary-400 mb-4" />
              </motion.div>
              <motion.h2 
                className="text-xl font-semibold text-gray-100 mb-2"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Processing Authentication
              </motion.h2>
              <motion.p 
                className="text-gray-400"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Please wait while we complete your authentication...
              </motion.p>
              {retryCount > 0 && (
                <motion.p 
                  className="text-sm text-gray-500 mt-2"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  Retry attempt {retryCount}
                </motion.p>
              )}
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.2 }}
              >
                <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-4" />
              </motion.div>
              <motion.h2 
                className="text-xl font-semibold text-gray-100 mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Success!
              </motion.h2>
              <motion.p 
                className="text-gray-400"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {message}
              </motion.p>
              <motion.div 
                className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-200"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p>✨ Setting up your account and workspace...</p>
              </motion.div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.2 }}
              >
                <XCircle className="h-8 w-8 mx-auto text-red-400 mb-4" />
              </motion.div>
              <motion.h2 
                className="text-xl font-semibold text-gray-100 mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Authentication Failed
              </motion.h2>
              <motion.p 
                className="text-red-400 text-sm"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {message}
              </motion.p>
              <motion.div 
                className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-200"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p>Please try signing in again or contact support if the problem persists.</p>
              </motion.div>
            </motion.div>
          )}

          {status === 'timeout' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.2 }}
              >
                <AlertCircle className="h-8 w-8 mx-auto text-yellow-400 mb-4" />
              </motion.div>
              <motion.h2 
                className="text-xl font-semibold text-gray-100 mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Taking Longer Than Expected
              </motion.h2>
              <motion.p 
                className="text-gray-400 text-sm"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {message}
              </motion.p>
              <motion.div 
                className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-sm text-yellow-200"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p>This might be due to network issues or high server load.</p>
              </motion.div>
              
              {showRetry && (
                <motion.div 
                  className="mt-6 space-y-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <button
                    onClick={handleRetry}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Try Again</span>
                  </button>
                  <button
                    onClick={handleManualRetry}
                    className="w-full bg-dark-700 hover:bg-dark-600 text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Go Back to Login
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}