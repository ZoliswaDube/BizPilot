import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Logo } from '../common/Logo'

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔐 AuthCallback: handleAuthCallback started')
      
      try {
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
          hasError: !!(error || searchError)
        })

        // Check for errors first
        if (error || searchError) {
          console.log('🔐 AuthCallback: Error in params', { 
            error: error || searchError, 
            errorDescription: errorDescription || searchErrorDescription 
          })
          setStatus('error')
          setMessage(errorDescription || searchErrorDescription || error || searchError || 'Authentication failed')
          return
        }

        // Handle OAuth implicit flow (access_token in URL fragment)
        if (accessToken && refreshToken) {
          console.log('🔐 AuthCallback: Handling OAuth implicit flow with access token')
          
          // The session should already be set by Supabase, but let's verify
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          console.log('🔐 AuthCallback: Session check result', { 
            hasSession: !!session, 
            sessionError: sessionError?.message,
            userId: session?.user?.id
          })
          
          if (sessionError) {
            console.error('🔐 AuthCallback: Session error', sessionError)
            setStatus('error')
            setMessage('Failed to establish session')
            return
          }

          if (session) {
            console.log('🔐 AuthCallback: Session confirmed, redirecting to dashboard')
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')
            
            // Clear the URL fragments to clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname)
            
            setTimeout(() => {
              navigate('/dashboard')
            }, 1500)
          } else {
            console.log('🔐 AuthCallback: No session found, redirecting to login')
            setStatus('error')
            setMessage('No session found. Please try logging in again.')
            setTimeout(() => {
              navigate('/auth')
            }, 2000)
          }
          return
        }

        // Handle PKCE flow (authorization code)
        if (code) {
          console.log('🔐 AuthCallback: Handling PKCE flow with authorization code')
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
            setStatus('error')
            setMessage(error.message)
            return
          }

          if (data.session) {
            console.log('🔐 AuthCallback: Session received from code exchange, redirecting to dashboard')
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')
            setTimeout(() => {
              navigate('/dashboard')
            }, 1500)
          }
          return
        }

        // Handle email verification or password reset
        const type = searchParams.get('type')
        const tokenHash = searchParams.get('token_hash')
        
        console.log('🔐 AuthCallback: Handling email verification/password reset', { type, hasTokenHash: !!tokenHash })
        
        if (type && tokenHash) {
          // Handle email verification with token hash
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any
          })

          if (verifyError) {
            console.error('🔐 AuthCallback: Error verifying token hash', verifyError)
            setStatus('error')
            setMessage('Failed to verify email. Please try again.')
            return
          }

          if (type === 'email_change' || type === 'signup') {
            console.log('🔐 AuthCallback: Email verification successful')
            setStatus('success')
            setMessage('Email verified successfully! You can now sign in.')
            setTimeout(() => {
              navigate('/auth')
            }, 3000)
          } else if (type === 'recovery') {
            console.log('🔐 AuthCallback: Password recovery verification successful')
            setStatus('success')
            setMessage('Password reset verified! You can now set a new password.')
            setTimeout(() => {
              navigate('/auth/reset-password')
            }, 2000)
          }
          return
        }

        // If we get here, something unexpected happened
        console.log('🔐 AuthCallback: No valid params found, checking session')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('🔐 AuthCallback: Existing session found, redirecting to dashboard')
          setStatus('success')
          setMessage('Welcome back! Redirecting...')
          setTimeout(() => {
            navigate('/dashboard')
          }, 1000)
        } else {
          console.log('🔐 AuthCallback: No session found, redirecting to auth')
          setStatus('error')
          setMessage('Authentication failed. Please try again.')
          setTimeout(() => {
            navigate('/auth')
          }, 2000)
        }
      } catch (err) {
        console.error('🔐 AuthCallback: Unexpected error in handleAuthCallback', err)
        setStatus('error')
        setMessage('An unexpected error occurred during authentication.')
        setTimeout(() => {
          navigate('/auth')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

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
        </div>
      </motion.div>
    </motion.div>
  )
}