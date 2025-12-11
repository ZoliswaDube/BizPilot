import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, ArrowLeft, Home } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '../common/Logo'

export function AuthErrorPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const error = searchParams.get('error') || 'Authentication failed'
  const errorDescription = searchParams.get('error_description') || 'An unexpected error occurred during authentication.'
  const errorCode = searchParams.get('error_code') || ''

  // Check if this is an OAuth redirect configuration error
  const errorDescLower = errorDescription.toLowerCase()
  const isRedirectError = errorDescLower.includes('redirect') || 
                          errorDescLower.includes('unauthorized') ||
                          errorCode === 'OAUTH_ERROR'

  // Get current origin once to avoid repetition
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'Unknown'

  const handleRetry = () => {
    console.log('🔐 AuthErrorPage: Retrying authentication')
    navigate('/auth')
  }

  const handleGoHome = () => {
    console.log('🔐 AuthErrorPage: Going to home page')
    navigate('/')
  }

  const handleGoBack = () => {
    console.log('🔐 AuthErrorPage: Going back')
    navigate(-1)
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
              <AlertCircle className="h-8 w-8 mx-auto text-red-400 mb-4" />
            </motion.div>
            
            <motion.h2 
              className="text-xl font-semibold text-gray-100 mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Authentication Error
            </motion.h2>
            
            <motion.div 
              className="mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-red-400 text-sm font-medium mb-2">
                {error}
              </p>
              <p className="text-gray-400 text-sm">
                {errorDescription}
              </p>
              {errorCode && (
                <p className="text-gray-500 text-xs mt-2">
                  Error Code: {errorCode}
                </p>
              )}
            </motion.div>

            <motion.div 
              className="p-4 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-200 mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {isRedirectError ? (
                <>
                  <p className="font-medium mb-2">⚠️ OAuth Configuration Issue</p>
                  <div className="text-left space-y-2 text-xs">
                    <p>This error typically occurs when the redirect URL is not configured in Supabase.</p>
                    <p className="font-medium mt-2">For Administrators:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to your Supabase Dashboard</li>
                      <li>Navigate to Authentication → URL Configuration</li>
                      <li>Add the following to "Redirect URLs":</li>
                      <li className="ml-4 font-mono text-primary-300">
                        {currentOrigin}/auth/callback
                      </li>
                      <li className="ml-4 font-mono text-primary-300">
                        {currentOrigin}/**
                      </li>
                      <li>Save and try again</li>
                    </ol>
                    <p className="mt-2 text-yellow-300">
                      💡 Current site: {currentOrigin}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium mb-2">What you can try:</p>
                  <ul className="text-left space-y-1 text-xs">
                    <li>• Check your internet connection</li>
                    <li>• Try signing in again</li>
                    <li>• Clear your browser cache and cookies</li>
                    <li>• Try a different browser</li>
                    <li>• Contact support if the problem persists</li>
                  </ul>
                </>
              )}
            </motion.div>

            <motion.div 
              className="space-y-3"
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
              
              <div className="flex space-x-3">
                <button
                  onClick={handleGoBack}
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Go Back</span>
                </button>
                
                <button
                  onClick={handleGoHome}
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
} 