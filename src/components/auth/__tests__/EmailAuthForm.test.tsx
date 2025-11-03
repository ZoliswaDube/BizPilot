import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EmailAuthForm } from '../EmailAuthForm'
import { useAuthStore } from '../../../store/auth'

// Mock auth store
vi.mock('../../../store/auth', () => ({
  useAuthStore: vi.fn(),
}))

// Mock supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  },
}))

describe('EmailAuthForm Component', () => {
  const mockSignUp = vi.fn()
  const mockSignIn = vi.fn()
  const mockResetPassword = vi.fn()
  const mockResendVerification = vi.fn()
  const mockOnModeChange = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      signUp: mockSignUp,
      signIn: mockSignIn,
      resetPassword: mockResetPassword,
      resendVerification: mockResendVerification,
    } as any)
  })

  describe('Signup Mode', () => {
    it('should render signup form correctly', () => {
      render(
        <EmailAuthForm
          mode="signup"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getAllByLabelText(/password/i).length).toBeGreaterThan(0)
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('should validate form fields', async () => {
      render(
        <EmailAuthForm
          mode="signup"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      render(
        <EmailAuthForm
          mode="signup"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    it('should validate password length', async () => {
      render(
        <EmailAuthForm
          mode="signup"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInputs = screen.getAllByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      fireEvent.change(fullNameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInputs[0], { target: { value: '123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })

    it('should validate password match', async () => {
      render(
        <EmailAuthForm
          mode="signup"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInputs = screen.getAllByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      fireEvent.change(fullNameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } })
      fireEvent.change(passwordInputs[1], { target: { value: 'password456' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should call signUp with correct data', async () => {
      mockSignUp.mockResolvedValue({ error: null })

      render(
        <EmailAuthForm
          mode="signup"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInputs = screen.getAllByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      fireEvent.change(fullNameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } })
      fireEvent.change(passwordInputs[1], { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', {
          full_name: 'Test User',
        })
      })
    })

    it('should display error message on signup failure', async () => {
      mockSignUp.mockResolvedValue({
        error: { message: 'User already registered', code: 'user_already_exists' },
      })

      render(
        <EmailAuthForm
          mode="signup"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      const fullNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInputs = screen.getAllByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      fireEvent.change(fullNameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } })
      fireEvent.change(passwordInputs[1], { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument()
      })
    })
  })

  describe('Signin Mode', () => {
    it('should render signin form correctly', () => {
      render(
        <EmailAuthForm
          mode="signin"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should call signIn with correct data', async () => {
      mockSignIn.mockResolvedValue({ error: null })

      render(
        <EmailAuthForm
          mode="signin"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('should call onSuccess on successful signin', async () => {
      mockSignIn.mockResolvedValue({ error: null })

      render(
        <EmailAuthForm
          mode="signin"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should display error for invalid credentials', async () => {
      mockSignIn.mockResolvedValue({
        error: { message: 'Invalid login credentials', code: 'invalid_credentials' },
      })

      render(
        <EmailAuthForm
          mode="signin"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })
  })

  describe('Reset Mode', () => {
    it('should render reset password form correctly', () => {
      render(
        <EmailAuthForm
          mode="reset"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
    })

    it('should call resetPassword with correct email', async () => {
      mockResetPassword.mockResolvedValue({ error: null })

      render(
        <EmailAuthForm
          mode="reset"
          onModeChange={mockOnModeChange}
          onSuccess={mockOnSuccess}
        />
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
      })
    })
  })
})
