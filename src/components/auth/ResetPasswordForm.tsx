import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { Logo } from '../common/Logo'

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const { updatePassword } = useAuthStore()

  useEffect(() => {
    // Check if we have the necessary tokens in the URL
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      setError('Invalid password reset link. Please request a new one.')
    }
  }, [searchParams])

  const validateForm = () => {
    setError('')
    
    if (!password) {
      setError('Password is required')
      return false
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    
    if (password.length > 72) {
      setError('Password must be less than 72 characters')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    // Basic password strength check
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    
    if (password.length >= 8 && (!hasUpperCase || !hasLowerCase || !hasNumbers)) {
      // This is a warning, not an error - still allow submission
      console.log('Weak password detected but allowed')
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const { error } = await updatePassword(password)
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          navigate('/dashboard')
        }, 3000)
      }
    } catch (err) {
      setError('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-dark-900 rounded-xl shadow-xl border border-dark-700 p-8">
            <div className="mx-auto flex justify-center mb-6">
              <Logo width={48} height={48} className="shadow-lg" />
            </div>
            <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-100 mb-2">
              Password Updated Successfully!
            </h2>
            <p className="text-gray-400">
              Your password has been updated. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex justify-center">
            <Logo width={48} height={48} className="shadow-lg" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-100">
            Set New Password
          </h2>
          <p className="text-gray-400 mb-4">
            Enter your new password below
          </p>
          <div className="p-3 bg-green-900/20 border border-green-500/30 rounded text-sm text-green-200">
            <p>🔒 Your account is now secured with your new password.</p>
          </div>
        </div>

        <div className="bg-dark-900 rounded-xl shadow-xl border border-dark-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start">
                <XCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-200 mb-4">
              <p>💡 <strong>Password tips:</strong> Use at least 8 characters with a mix of uppercase, lowercase, and numbers for better security.</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your new password"
                  minLength={6}
                />
                <Lock className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
                <button
                  type="button"
                  className="absolute right-3 top-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Confirm your new password"
                  minLength={6}
                />
                <Lock className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
                <button
                  type="button"
                  className="absolute right-3 top-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary group w-full flex justify-center items-center"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}