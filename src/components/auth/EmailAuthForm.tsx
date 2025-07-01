import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'

type AuthMode = 'signin' | 'signup' | 'reset'

interface EmailAuthFormProps {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  onSuccess: () => void
}

export function EmailAuthForm({ mode, onModeChange, onSuccess }: EmailAuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signUp, signIn, resetPassword, resendVerification } = useAuth()

  const validateForm = () => {
    setError('')
    
    if (!email) {
      setError('Email is required')
      return false
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (mode !== 'reset') {
      if (!password) {
        setError('Password is required')
        return false
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters long')
        return false
      }
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Full name is required')
        return false
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔐 EmailAuthForm: handleSubmit called', { mode, email: email.substring(0, 3) + '***' })
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let result: { error: any }
      
      switch (mode) {
        case 'signup':
          console.log('🔐 EmailAuthForm: Attempting signup')
          result = await signUp(email, password, { full_name: fullName.trim() })
          console.log('🔐 EmailAuthForm: Signup result', { error: result.error?.message, hasError: !!result.error })
          if (!result.error) {
            setSuccess('Please check your email and click the verification link to complete your registration.')
          }
          break
          
        case 'signin':
          console.log('🔐 EmailAuthForm: Attempting signin')
          result = await signIn(email, password)
          console.log('🔐 EmailAuthForm: Signin result', { error: result.error?.message, hasError: !!result.error })
          if (!result.error) {
            console.log('🔐 EmailAuthForm: Signin successful, calling onSuccess')
            onSuccess()
          }
          break
          
        case 'reset':
          console.log('🔐 EmailAuthForm: Attempting password reset')
          result = await resetPassword(email)
          console.log('🔐 EmailAuthForm: Reset result', { error: result.error?.message, hasError: !!result.error })
          if (!result.error) {
            setSuccess('Password reset email sent! Check your inbox for instructions.')
          }
          break
          
        default:
          result = { error: new Error('Invalid mode') }
      }

      if (result.error) {
        console.log('🔐 EmailAuthForm: Handling auth error', result.error)
        handleAuthError(result.error)
      }
    } catch (err) {
      console.error('🔐 EmailAuthForm: Unexpected error in handleSubmit', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAuthError = (error: any) => {
    console.log('🔐 EmailAuthForm: handleAuthError called', { 
      message: error.message, 
      code: error.code,
      status: error.status,
      details: error.details,
      fullError: error 
    })
    
    const message = error.message || error.toString()
    
    if (message.includes('Invalid login credentials')) {
      setError('Invalid email or password. Please check your credentials and try again.')
    } else if (message.includes('Email rate limit exceeded')) {
      setError('Too many attempts. Please wait a few minutes before trying again.')
    } else if (message.includes('Email not confirmed')) {
      setError(
        <div className="space-y-2">
          <p>Please verify your email address before signing in.</p>
          <button
            onClick={handleResendVerification}
            className="text-primary-400 hover:text-primary-300 text-sm underline"
          >
            Resend verification email
          </button>
        </div>
      )
    } else if (message.includes('Email link is invalid or has expired')) {
      setError('This verification link has expired. Please request a new one.')
    } else if (message.includes('User already registered')) {
      setError('This email is already registered. Please sign in instead or use a different email.')
    } else if (message.includes('Password should be at least 6 characters')) {
      setError('Password must be at least 6 characters long.')
    } else if (message.includes('Invalid email')) {
      setError('Please enter a valid email address.')
    } else if (message.includes('Unable to validate email address')) {
      setError('Please enter a valid email address.')
    } else if (message.includes('Signup is disabled')) {
      setError('New user registration is currently disabled. Please contact support.')
    } else if (message.includes('Password is too weak')) {
      setError('Password is too weak. Please use a stronger password with a mix of letters, numbers, and symbols.')
    } else {
      setError(message || 'An authentication error occurred. Please try again.')
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    console.log('🔐 EmailAuthForm: Attempting to resend verification')
    setLoading(true)
    setError('')
    
    try {
      const { error } = await resendVerification(email)
      console.log('🔐 EmailAuthForm: Resend verification result', { error: error?.message, hasError: !!error })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Verification email resent! Check your inbox.')
      }
    } catch (err) {
      console.error('🔐 EmailAuthForm: Error in handleResendVerification', err)
      setError('Failed to resend verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AnimatePresence>
        {error && (
          <motion.div 
            className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
            >
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            </motion.div>
            <div>{error}</div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {success && (
          <motion.div 
            className="bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm flex items-start"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
            >
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            </motion.div>
            <div>{success}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'signup' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
            Full Name
          </label>
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field pl-10"
              placeholder="Enter your full name"
            />
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <User className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
      >
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email Address
        </label>
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field pl-10"
            placeholder="Enter your email"
          />
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Mail className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
          </motion.div>
        </motion.div>
      </motion.div>

      {mode !== 'reset' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
        >
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10 pr-10"
              placeholder="Enter your password"
              minLength={6}
            />
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Lock className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
            </motion.div>
            <motion.button
              type="button"
              className="absolute right-3 top-3"
              onClick={() => setShowPassword(!showPassword)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {mode === 'signup' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
        >
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
            Confirm Password
          </label>
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field pl-10 pr-10"
              placeholder="Confirm your password"
              minLength={6}
            />
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Lock className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
            </motion.div>
            <motion.button
              type="button"
              className="absolute right-3 top-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      <motion.button
        type="submit"
        className="btn-primary group w-full flex justify-center items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.3, 
          delay: 0.4, 
          ease: "easeOut",
          type: "spring", 
          stiffness: 400, 
          damping: 17 
        }}
        whileHover={{ scale: 1.05 }}
        disabled={loading}
      >
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-4 w-4 mr-2" />
          </motion.div>
        )}
        {mode === 'signup' && 'Create Account'}
        {mode === 'signin' && 'Sign In'}
        {mode === 'reset' && 'Send Reset Email'}
      </motion.button>

      {mode === 'signin' && (
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, ease: "easeOut" }}
        >
          <motion.button
            type="button"
            onClick={() => onModeChange('reset')}
            className="text-primary-400 hover:text-primary-300 text-sm"
            whileHover={{ scale: 1.05, textShadow: "0 0 8px rgba(59, 130, 246, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Forgot your password?
          </motion.button>
        </motion.div>
      )}
    </form>
  )
}