import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../common/Logo'
import { AuthTabs } from './AuthTabs'
import { EmailAuthForm } from './EmailAuthForm'
import { OAuthButtons } from './OAuthButtons'

type AuthMode = 'signin' | 'signup' | 'reset'

export function AuthForm() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('signin')

  const handleAuthSuccess = () => {
    console.log('🔐 AuthForm: handleAuthSuccess called, navigating to dashboard')
    navigate('/dashboard')
  }

  const getTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create your account'
      case 'reset':
        return 'Reset your password'
      default:
        return 'Sign in to your account'
    }
  }

  const getSubtitle = () => {
    switch (mode) {
      case 'signup':
        return 'Join BizPilot and start managing your business smarter'
      case 'reset':
        return 'Enter your email to receive a password reset link'
      default:
        return 'Welcome back to BizPilot'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex justify-center">
            <Logo width={48} height={48} className="shadow-lg" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-100">
            {getTitle()}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {getSubtitle()}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-dark-900 rounded-xl shadow-xl border border-dark-700 p-8">
          <AuthTabs mode={mode} onModeChange={setMode} />

          {mode !== 'reset' && (
            <>
              <OAuthButtons onSuccess={handleAuthSuccess} />
              <div className="mt-6">
                <EmailAuthForm 
                  mode={mode} 
                  onModeChange={setMode}
                  onSuccess={handleAuthSuccess}
                />
              </div>
            </>
          )}

          {mode === 'reset' && (
            <EmailAuthForm 
              mode={mode} 
              onModeChange={setMode}
              onSuccess={handleAuthSuccess}
            />
          )}

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm">
            {mode === 'signin' && (
              <p className="text-gray-400">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Sign up here
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Legal */}
        <p className="text-center text-xs text-gray-500">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}