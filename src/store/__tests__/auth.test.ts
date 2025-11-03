import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../auth'
import { supabase } from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      resetPasswordForEmail: vi.fn(),
      resendSignUpConfirmation: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          maybeSingle: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
    })),
  },
  getURL: vi.fn(() => 'http://localhost:5173/'),
}))

// Mock inactivity service
vi.mock('../../services/inactivityService', () => ({
  inactivityService: {
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    setCallbacks: vi.fn(),
    getTimeUntilTimeout: vi.fn(() => 180000),
  },
}))

// Mock MCP
vi.mock('../../lib/mcp', () => ({
  ensureUserProfile: vi.fn(),
}))

// Mock Sentry
vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
}))

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      session: null,
      userProfile: null,
      businessUser: null,
      loading: false,
      showInactivityWarning: false,
      inactivityTimeRemaining: 0,
    })
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { access_token: 'token-123', user: mockUser }

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { signUp } = useAuthStore.getState()
      const result = await signUp('test@example.com', 'password123', { full_name: 'Test User' })

      expect(result.error).toBeNull()
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:5173/auth/callback',
          data: { full_name: 'Test User' },
        },
      })
    })

    it('should handle signup error', async () => {
      const mockError = { message: 'User already exists', code: 'user_already_exists' }

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      })

      const { signUp } = useAuthStore.getState()
      const result = await signUp('existing@example.com', 'password123')

      expect(result.error).toEqual(mockError)
    })

    it('should handle email confirmation requirement', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser, session: null }, // No session = email confirmation required
        error: null,
      })

      const { signUp } = useAuthStore.getState()
      const result = await signUp('test@example.com', 'password123')

      expect(result.error).toBeNull()
      // When email confirmation is required, session is null
      expect(result.data?.session).toBeNull()
    })
  })

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { access_token: 'token-123', user: mockUser }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { signIn } = useAuthStore.getState()
      const result = await signIn('test@example.com', 'password123')

      expect(result.error).toBeNull()
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should handle invalid credentials error', async () => {
      const mockError = { message: 'Invalid login credentials', code: 'invalid_credentials' }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      })

      const { signIn } = useAuthStore.getState()
      const result = await signIn('test@example.com', 'wrongpassword')

      expect(result.error).toEqual(mockError)
    })

    it('should handle email not confirmed error', async () => {
      const mockError = { message: 'Email not confirmed', code: 'email_not_confirmed' }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      })

      const { signIn } = useAuthStore.getState()
      const result = await signIn('unverified@example.com', 'password123')

      expect(result.error).toEqual(mockError)
    })
  })

  describe('signInWithProvider (OAuth)', () => {
    it('should initiate Google OAuth flow', async () => {
      const mockUrl = 'https://accounts.google.com/oauth/...'

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { provider: 'google', url: mockUrl },
        error: null,
      })

      const { signInWithProvider } = useAuthStore.getState()
      const result = await signInWithProvider('google')

      expect(result.error).toBeNull()
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:5173/auth/callback',
        },
      })
    })

    it('should handle OAuth error', async () => {
      const mockError = { message: 'OAuth provider error', code: 'oauth_error' }

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { provider: 'google', url: null },
        error: mockError,
      })

      const { signInWithProvider } = useAuthStore.getState()
      const result = await signInWithProvider('google')

      expect(result.error).toEqual(mockError)
    })

    it('should prevent concurrent OAuth requests', async () => {
      useAuthStore.setState({ loading: true })

      const { signInWithProvider } = useAuthStore.getState()
      const result = await signInWithProvider('google')

      // Should return early without calling Supabase
      expect(result.error).toBeNull()
      expect(supabase.auth.signInWithOAuth).not.toHaveBeenCalled()
    })
  })

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      useAuthStore.setState({
        user: { id: 'user-123' } as any,
        session: { access_token: 'token-123' } as any,
        userProfile: { id: 'profile-123' } as any,
        businessUser: { id: 'business-123' } as any,
      })

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null })

      const { signOut } = useAuthStore.getState()
      const result = await signOut()

      expect(result.error).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalled()

      // Verify state was cleared
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
      expect(state.userProfile).toBeNull()
      expect(state.businessUser).toBeNull()
    })

    it('should clear state even if signOut fails', async () => {
      useAuthStore.setState({
        user: { id: 'user-123' } as any,
        session: { access_token: 'token-123' } as any,
      })

      const mockError = { message: 'Network error' }
      vi.mocked(supabase.auth.signOut).mockRejectedValueOnce(mockError)

      const { signOut } = useAuthStore.getState()
      const result = await signOut()

      // State should still be cleared
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
    })
  })

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: null,
      })

      const { resetPassword } = useAuthStore.getState()
      const result = await resetPassword('test@example.com')

      expect(result.error).toBeNull()
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'http://localhost:5173/auth/reset-password',
      })
    })

    it('should handle reset password error', async () => {
      const mockError = { message: 'Invalid email', code: 'invalid_email' }

      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: mockError,
      })

      const { resetPassword } = useAuthStore.getState()
      const result = await resetPassword('invalid-email')

      expect(result.error).toEqual(mockError)
    })
  })

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      vi.mocked(supabase.auth.resendSignUpConfirmation).mockResolvedValueOnce({
        data: {},
        error: null,
      })

      const { resendVerification } = useAuthStore.getState()
      const result = await resendVerification('test@example.com')

      expect(result.error).toBeNull()
      expect(supabase.auth.resendSignUpConfirmation).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost:5173/auth/callback',
        },
      })
    })
  })

  describe('State Management', () => {
    it('should update user state', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      const { setUser } = useAuthStore.getState()
      setUser(mockUser as any)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
    })

    it('should update session state', () => {
      const mockSession = { access_token: 'token-123' }

      const { setSession } = useAuthStore.getState()
      setSession(mockSession as any)

      const state = useAuthStore.getState()
      expect(state.session).toEqual(mockSession)
    })

    it('should update loading state', () => {
      const { setLoading } = useAuthStore.getState()
      setLoading(true)

      let state = useAuthStore.getState()
      expect(state.loading).toBe(true)

      setLoading(false)
      state = useAuthStore.getState()
      expect(state.loading).toBe(false)
    })

    it('should update inactivity warning state', () => {
      const { setInactivityWarning } = useAuthStore.getState()
      setInactivityWarning(true, 60000)

      const state = useAuthStore.getState()
      expect(state.showInactivityWarning).toBe(true)
      expect(state.inactivityTimeRemaining).toBe(60000)
    })
  })

  describe('Inactivity Handling', () => {
    it('should start inactivity tracking', () => {
      const { inactivityService } = require('../../services/inactivityService')

      const { startInactivityTracking } = useAuthStore.getState()
      startInactivityTracking()

      expect(inactivityService.setCallbacks).toHaveBeenCalled()
      expect(inactivityService.start).toHaveBeenCalled()
    })

    it('should stop inactivity tracking', () => {
      const { inactivityService } = require('../../services/inactivityService')

      const { stopInactivityTracking } = useAuthStore.getState()
      stopInactivityTracking()

      expect(inactivityService.stop).toHaveBeenCalled()

      const state = useAuthStore.getState()
      expect(state.showInactivityWarning).toBe(false)
      expect(state.inactivityTimeRemaining).toBe(0)
    })

    it('should extend session', () => {
      const { inactivityService } = require('../../services/inactivityService')

      useAuthStore.setState({ showInactivityWarning: true, inactivityTimeRemaining: 30000 })

      const { extendSession } = useAuthStore.getState()
      extendSession()

      expect(inactivityService.reset).toHaveBeenCalled()

      const state = useAuthStore.getState()
      expect(state.showInactivityWarning).toBe(false)
      expect(state.inactivityTimeRemaining).toBe(0)
    })
  })
})
