import { Mail, KeyRound, ArrowLeft } from 'lucide-react'

type AuthMode = 'signin' | 'signup' | 'reset'

interface AuthTabsProps {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
}

export function AuthTabs({ mode, onModeChange }: AuthTabsProps) {
  if (mode === 'reset') {
    return (
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => onModeChange('signin')}
          className="flex items-center text-primary-400 hover:text-primary-300 text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Sign In
        </button>
        <h2 className="text-xl font-semibold text-gray-100">Reset Password</h2>
      </div>
    )
  }

  return (
    <div className="flex space-x-1 p-1 bg-dark-800 rounded-lg mb-6">
      <button
        onClick={() => onModeChange('signin')}
        className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all ${
          mode === 'signin'
            ? 'bg-primary-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        <Mail className="h-4 w-4 mr-2" />
        Sign In
      </button>
      <button
        onClick={() => onModeChange('signup')}
        className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all ${
          mode === 'signup'
            ? 'bg-primary-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        <KeyRound className="h-4 w-4 mr-2" />
        Sign Up
      </button>
    </div>
  )
}