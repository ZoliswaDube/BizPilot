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
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        console.log('🔐 AuthCallback: URL params', { 
          hasCode: !!code, 
          error, 
          errorDescription,
          allParams: Object.fromEntries(searchParams.entries())
        })

        if (error) {
          console.log('🔐 AuthCallback: Error in URL params', { error, errorDescription })
          setStatus('error')
          setMessage(errorDescription || error)
          return
        }

        if (code) {
          console.log('🔐 AuthCallback: Exchanging code for session')
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
            console.log('🔐 AuthCallback: Session received, redirecting to dashboard')
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')
            setTimeout(() => {
              navigate('/dashboard')
            }, 2000)
          }
        } else {
          // Handle email verification or password reset
          const type = searchParams.get('type')
          
          console.log('🔐 AuthCallback: Handling email verification/password reset', { type })
          
          if (type === 'email_change' || type === 'signup') {
            console.log('🔐 AuthCallback: Email verification flow')
            setStatus('success')
            setMessage('Email verified successfully! You can now sign in.')
            setTimeout(() => {
              navigate('/auth')
            }, 3000)
          } else if (type === 'recovery') {
            console.log('🔐 AuthCallback: Password recovery flow')
            setStatus('success')
            setMessage('Password reset verified! You can now set a new password.')
            setTimeout(() => {
              navigate('/auth/reset-password')
            }, 2000)
          } else {
            console.log('🔐 AuthCallback: Default redirect to dashboard')
            setStatus('success')
            setMessage('Redirecting...')
            setTimeout(() => {
              navigate('/dashboard')
            }, 1000)
          }
        }
      } catch (err) {
        console.error('🔐 AuthCallback: Unexpected error in handleAuthCallback', err)
        setStatus('error')
        setMessage('An unexpected error occurred during authentication.')
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
                className="text-red-400 mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {message}
              </motion.p>
              <motion.div 
                className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-200"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p>💡 Try clearing your browser cache or using an incognito window if the problem persists.</p>
              </motion.div>
              <motion.button
                onClick={() => navigate('/auth')}
                className="btn-primary group"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}