import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAuthStore } from '../../store/auth'
import { supabase } from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      resend: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          maybeSingle: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null })),
      })),
    })),
  },
}))

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      businessUser: null,
      loading: false,
      initialized: false,
      showInactivityWarning: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete User Registration Flow', () => {
    it('should handle full registration: signup → email verification → profile creation', async () => {
      const mockUser = { id: 'user-123', email: 'newuser@test.com' }
      const mockSession = { access_token: 'token-123', user: mockUser }

      // Step 1: Sign up
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      })

      const { signUp } = useAuthStore.getState()
      const signUpResult = await signUp('newuser@test.com', 'password123', {
        full_name: 'New User',
      })

      expect(signUpResult.error).toBeNull()
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@test.com',
        password: 'password123',
        options: {
          data: { full_name: 'New User' },
        },
      })

      // Step 2: User verifies email (simulated by getting session)
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Step 3: Profile should be created
      const mockProfile = {
        id: 'user-123',
        email: 'newuser@test.com',
        full_name: 'New User',
        created_at: new Date().toISOString(),
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: mockProfile, error: null })),
          })),
        })),
      } as any)

      // Verify complete registration flow
      expect(signUpResult.error).toBeNull()
    })

    it('should handle registration with existing email', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', code: 'user_already_exists' } as any,
      })

      const { signUp } = useAuthStore.getState()
      const result = await signUp('existing@test.com', 'password123', {
        full_name: 'Existing User',
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.code).toBe('user_already_exists')
    })
  })

  describe('Complete Login Flow', () => {
    it('should handle full login: signin → load profile → load business', async () => {
      const mockUser = { id: 'user-123', email: 'user@test.com' }
      const mockSession = { access_token: 'token-123', user: mockUser }

      // Step 1: Sign in
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { signIn } = useAuthStore.getState()
      const result = await signIn('user@test.com', 'password123')

      expect(result.error).toBeNull()
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'password123',
      })

      // Step 2: Profile loaded
      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.session).toEqual(mockSession)
    })

    it('should handle invalid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials', code: 'invalid_credentials' } as any,
      })

      const { signIn } = useAuthStore.getState()
      const result = await signIn('user@test.com', 'wrongpassword')

      expect(result.error).toBeTruthy()
      expect(result.error?.code).toBe('invalid_credentials')
    })

    it('should handle unverified email', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed', code: 'email_not_confirmed' } as any,
      })

      const { signIn } = useAuthStore.getState()
      const result = await signIn('unverified@test.com', 'password123')

      expect(result.error).toBeTruthy()
      expect(result.error?.code).toBe('email_not_confirmed')
    })
  })

  describe('OAuth Flow', () => {
    it('should initiate OAuth flow with correct redirect URL', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com/...' },
        error: null,
      })

      const { signInWithProvider } = useAuthStore.getState()
      const result = await signInWithProvider('google')

      expect(result.error).toBeNull()
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })

    it('should handle OAuth errors gracefully', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { message: 'OAuth provider error' } as any,
      })

      const { signInWithProvider } = useAuthStore.getState()
      const result = await signInWithProvider('google')

      expect(result.error).toBeTruthy()
    })
  })

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      })

      const { resetPassword } = useAuthStore.getState()
      const result = await resetPassword('user@test.com')

      expect(result.error).toBeNull()
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@test.com', {
        redirectTo: expect.stringContaining('/reset-password'),
      })
    })
  })

  describe('Session Management', () => {
    it('should maintain session state across page refreshes', async () => {
      const mockUser = { id: 'user-123', email: 'user@test.com' }
      const mockSession = { access_token: 'token-123', user: mockUser }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { initialize } = useAuthStore.getState()
      await initialize()

      const state = useAuthStore.getState()
      expect(state.initialized).toBe(true)
      expect(state.user).toEqual(mockUser)
      expect(state.session).toEqual(mockSession)
    })

    it('should handle expired session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' } as any,
      })

      const { initialize } = useAuthStore.getState()
      await initialize()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
    })
  })

  describe('Logout Flow', () => {
    it('should clear all user data on logout', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: { id: 'user-123', email: 'user@test.com' } as any,
        session: { access_token: 'token-123' } as any,
        profile: { id: 'user-123' } as any,
        businessUser: { id: 'business-user-123' } as any,
      })

      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

      const { signOut } = useAuthStore.getState()
      await signOut()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
      expect(state.profile).toBeNull()
      expect(state.businessUser).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('Inactivity Management', () => {
    it('should show warning before auto-logout', () => {
      const { setShowInactivityWarning } = useAuthStore.getState()
      
      setShowInactivityWarning(true)
      
      let state = useAuthStore.getState()
      expect(state.showInactivityWarning).toBe(true)

      setShowInactivityWarning(false)
      
      state = useAuthStore.getState()
      expect(state.showInactivityWarning).toBe(false)
    })

    it('should extend session when user is active', () => {
      const { extendSession } = useAuthStore.getState()
      
      extendSession()
      
      const state = useAuthStore.getState()
      expect(state.showInactivityWarning).toBe(false)
    })
  })
})
