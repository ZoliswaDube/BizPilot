import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as WebBrowser from 'expo-web-browser';
import { apiClient } from '../config/api';

// Complete auth session for WebBrowser
WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  last_sign_in: string;
  created_at: string;
}

export interface BizPilotAuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  metadata?: Record<string, any>;
}

export interface SignInData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ResetPasswordData {
  email: string;
}

export interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  available: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private session: BizPilotAuthSession | null = null;
  private biometricEnabled = false;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize authentication service
  async initialize(): Promise<BizPilotAuthSession | null> {
    try {
      // Check for existing session
      const storedSession = await this.getStoredSession();
      if (storedSession && this.isSessionValid(storedSession)) {
        this.session = storedSession;
        return storedSession;
      }

      // Clear invalid session
      if (storedSession) {
        await this.clearSession();
      }

      return null;
    } catch (error) {
      console.error('Auth initialization error:', error);
      return null;
    }
  }

  // Sign up with email and password
  async signUp(data: SignUpData): Promise<{ session: BizPilotAuthSession | null; error: AuthError | null }> {
    try {
      const response = await apiClient.auth.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      });

      if (!response.user || !response.tokens) {
        return {
          session: null,
          error: { message: 'Registration failed', code: 'signup_error' },
        };
      }

      const mappedUser: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.profile?.full_name || undefined,
        avatar_url: response.user.profile?.avatar_url || undefined,
        created_at: response.user.createdAt,
        last_sign_in: new Date().toISOString(),
      };

      const mappedSession: BizPilotAuthSession = {
        access_token: response.tokens.accessToken,
        refresh_token: response.tokens.refreshToken,
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
        user: mappedUser,
      };

      await this.storeSession(mappedSession);
      this.session = mappedSession;
      return { session: mappedSession, error: null };
    } catch (error) {
      return {
        session: null,
        error: {
          message: error instanceof Error ? error.message : 'Failed to sign up',
          code: 'signup_error'
        }
      };
    }
  }

  // Sign in with email and password
  async signIn(data: SignInData): Promise<{ session: BizPilotAuthSession | null; error: AuthError | null }> {
    try {
      const response = await apiClient.auth.login({
        email: data.email,
        password: data.password,
      });

      if (!response.user || !response.tokens) {
        return {
          session: null,
          error: { message: 'Invalid credentials', code: 'signin_error' },
        };
      }

      const mappedUser: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.profile?.full_name || undefined,
        avatar_url: response.user.profile?.avatar_url || undefined,
        created_at: response.user.createdAt,
        last_sign_in: new Date().toISOString(),
      };

      const mappedSession: BizPilotAuthSession = {
        access_token: response.tokens.accessToken,
        refresh_token: response.tokens.refreshToken,
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
        user: mappedUser,
      };

      await this.storeSession(mappedSession, data.rememberMe);
      this.session = mappedSession;
      return { session: mappedSession, error: null };
    } catch (error) {
      return {
        session: null,
        error: {
          message: error instanceof Error ? error.message : 'Invalid credentials',
          code: 'signin_error'
        }
      };
    }
  }

  // Sign in with biometric authentication
  async signInWithBiometric(): Promise<{ session: BizPilotAuthSession | null; error: AuthError | null }> {
    try {
      // Check if biometric is available and configured
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isAvailable || !isEnrolled) {
        return {
          session: null,
          error: {
            message: 'Biometric authentication not available',
            code: 'biometric_unavailable'
          }
        };
      }

      // Authenticate with biometric
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to BizPilot',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use password instead',
      });

      if (!authResult.success) {
        return {
          session: null,
          error: {
            message: 'Biometric authentication failed',
            code: 'biometric_failed'
          }
        };
      }

      // Get stored credentials for biometric user
      const storedCredentials = await SecureStore.getItemAsync('biometric_credentials');
      if (!storedCredentials) {
        return {
          session: null,
          error: {
            message: 'No biometric credentials found',
            code: 'biometric_no_credentials'
          }
        };
      }

      const credentials = JSON.parse(storedCredentials);
      return await this.signIn(credentials);
    } catch (error) {
      return {
        session: null,
        error: {
          message: error instanceof Error ? error.message : 'Biometric authentication error',
          code: 'biometric_error'
        }
      };
    }
  }

  // OAuth sign in - placeholder for future implementation with custom backend
  async signInWithOAuth(provider: string): Promise<{ session: BizPilotAuthSession | null; error: AuthError | null }> {
    return {
      session: null,
      error: {
        message: 'OAuth authentication not yet implemented with custom backend',
        code: 'oauth_not_implemented'
      }
    };
  }

  // Reset password
  async resetPassword(data: ResetPasswordData): Promise<{ error: AuthError | null }> {
    try {
      // TODO: Implement password reset with custom backend
      return {
        error: {
          message: 'Password reset not yet implemented with custom backend',
          code: 'reset_not_implemented'
        }
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to reset password',
          code: 'reset_error'
        }
      };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      await apiClient.auth.logout();
      await this.clearSession();
      this.session = null;
      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to sign out',
          code: 'signout_error'
        }
      };
    }
  }

  // Get current session
  getSession(): BizPilotAuthSession | null {
    return this.session;
  }

  // Get current user
  getUser(): AuthUser | null {
    return this.session?.user || null;
  }

  // Enable biometric authentication
  async enableBiometric(credentials: SignInData): Promise<{ error: AuthError | null }> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isAvailable || !isEnrolled) {
        return {
          error: {
            message: 'Biometric authentication not available',
            code: 'biometric_unavailable'
          }
        };
      }

      // Store credentials securely for biometric access
      await SecureStore.setItemAsync('biometric_credentials', JSON.stringify(credentials));
      this.biometricEnabled = true;

      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to enable biometric',
          code: 'biometric_setup_error'
        }
      };
    }
  }

  // Disable biometric authentication
  async disableBiometric(): Promise<{ error: AuthError | null }> {
    try {
      await SecureStore.deleteItemAsync('biometric_credentials');
      this.biometricEnabled = false;
      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to disable biometric',
          code: 'biometric_disable_error'
        }
      };
    }
  }

  // Check if biometric is enabled
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const credentials = await SecureStore.getItemAsync('biometric_credentials');
      return !!credentials;
    } catch {
      return false;
    }
  }

  // Get available OAuth providers
  getOAuthProviders(): OAuthProvider[] {
    return [
      {
        id: 'google',
        name: 'Google',
        icon: 'google',
        color: '#4285f4',
        available: true,
      },
      {
        id: 'apple',
        name: 'Apple',
        icon: 'apple',
        color: '#000000',
        available: true,
      },
      {
        id: 'facebook',
        name: 'Facebook',
        icon: 'facebook',
        color: '#1877f2',
        available: true,
      },
    ];
  }

  // Private helper methods

  private async storeSession(session: BizPilotAuthSession, persistent = true): Promise<void> {
    const storage = persistent ? SecureStore : AsyncStorage;
    const key = 'auth_session';
    
    if (persistent && await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(key, JSON.stringify(session));
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(session));
    }
  }

  private async getStoredSession(): Promise<BizPilotAuthSession | null> {
    try {
      // Try SecureStore first
      if (await SecureStore.isAvailableAsync()) {
        const sessionData = await SecureStore.getItemAsync('auth_session');
        if (sessionData) {
          return JSON.parse(sessionData);
        }
      }

      // Fallback to AsyncStorage
      const sessionData = await AsyncStorage.getItem('auth_session');
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      return null;
    } catch {
      return null;
    }
  }

  private async clearSession(): Promise<void> {
    try {
      if (await SecureStore.isAvailableAsync()) {
        await SecureStore.deleteItemAsync('auth_session');
      }
      await AsyncStorage.removeItem('auth_session');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  private isSessionValid(session: BizPilotAuthSession): boolean {
    return session.expires_at > Date.now();
  }

  // Refresh session if needed
  async refreshSession(): Promise<BizPilotAuthSession | null> {
    if (!this.session) return null;

    if (this.isSessionValid(this.session)) {
      return this.session;
    }

    try {
      // In a real implementation, this would refresh the token
      const refreshedSession = {
        ...this.session,
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // Extend by 24 hours
      };

      await this.storeSession(refreshedSession);
      this.session = refreshedSession;
      
      return refreshedSession;
    } catch (error) {
      console.error('Session refresh error:', error);
      await this.signOut();
      return null;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance(); 