import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { mcp_supabase_execute_sql } from './mcpClient';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  last_sign_in: string;
  created_at: string;
}

export interface AuthSession {
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
  private session: AuthSession | null = null;
  private biometricEnabled = false;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize authentication service
  async initialize(): Promise<AuthSession | null> {
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
  async signUp(data: SignUpData): Promise<{ session: AuthSession | null; error: AuthError | null }> {
    try {
      // In a real implementation, this would call Supabase via MCP
      const result = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO auth.users (email, password, raw_user_meta_data)
          VALUES ($1, crypt($2, gen_salt('bf')), $3)
          RETURNING id, email, created_at
        `,
        params: [data.email, data.password, { full_name: data.fullName, ...data.metadata }]
      });

      if (result.success && result.data?.[0]) {
        const user = result.data[0];
        const session = await this.createSession(user);
        await this.storeSession(session);
        this.session = session;
        
        return { session, error: null };
      }

      // Mock successful signup for development
      const mockUser: AuthUser = {
        id: Date.now().toString(),
        email: data.email,
        name: data.fullName,
        created_at: new Date().toISOString(),
        last_sign_in: new Date().toISOString(),
      };

      const session = await this.createSession(mockUser);
      await this.storeSession(session);
      this.session = session;

      return { session, error: null };
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
  async signIn(data: SignInData): Promise<{ session: AuthSession | null; error: AuthError | null }> {
    try {
      // In a real implementation, this would validate credentials via MCP
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT id, email, raw_user_meta_data, created_at, last_sign_in_at
          FROM auth.users 
          WHERE email = $1 AND password = crypt($2, password)
        `,
        params: [data.email, data.password]
      });

      if (result.success && result.data?.[0]) {
        const user = result.data[0];
        const session = await this.createSession(user);
        await this.storeSession(session, data.rememberMe);
        this.session = session;
        
        return { session, error: null };
      }

      // Mock successful sign-in for development
      const mockUser: AuthUser = {
        id: '1',
        email: data.email,
        name: 'Demo User',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        last_sign_in: new Date().toISOString(),
      };

      const session = await this.createSession(mockUser);
      await this.storeSession(session, data.rememberMe);
      this.session = session;

      return { session, error: null };
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
  async signInWithBiometric(): Promise<{ session: AuthSession | null; error: AuthError | null }> {
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

  // OAuth sign in
  async signInWithOAuth(provider: string): Promise<{ session: AuthSession | null; error: AuthError | null }> {
    try {
      // In a real implementation, this would handle OAuth flow
      // For now, return mock successful OAuth
      const mockUser: AuthUser = {
        id: Date.now().toString(),
        email: `user@${provider}.com`,
        name: `${provider} User`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
        created_at: new Date().toISOString(),
        last_sign_in: new Date().toISOString(),
      };

      const session = await this.createSession(mockUser);
      await this.storeSession(session);
      this.session = session;

      return { session, error: null };
    } catch (error) {
      return {
        session: null,
        error: {
          message: error instanceof Error ? error.message : 'OAuth authentication failed',
          code: 'oauth_error'
        }
      };
    }
  }

  // Reset password
  async resetPassword(data: ResetPasswordData): Promise<{ error: AuthError | null }> {
    try {
      // In a real implementation, this would send reset email via MCP
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT id FROM auth.users WHERE email = $1
        `,
        params: [data.email]
      });

      if (result.success && result.data?.[0]) {
        // Mock successful reset email send
        return { error: null };
      }

      return {
        error: {
          message: 'Email not found',
          code: 'email_not_found'
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
  getSession(): AuthSession | null {
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
  private async createSession(user: any): Promise<AuthSession> {
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours

    return {
      access_token: `mock_access_token_${now}`,
      refresh_token: `mock_refresh_token_${now}`,
      expires_at: expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.raw_user_meta_data?.full_name || user.name,
        avatar_url: user.raw_user_meta_data?.avatar_url || user.avatar_url,
        role: user.role || 'user',
        last_sign_in: user.last_sign_in_at || new Date().toISOString(),
        created_at: user.created_at,
      },
    };
  }

  private async storeSession(session: AuthSession, persistent = true): Promise<void> {
    const storage = persistent ? SecureStore : AsyncStorage;
    const key = 'auth_session';
    
    if (persistent && SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(key, JSON.stringify(session));
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(session));
    }
  }

  private async getStoredSession(): Promise<AuthSession | null> {
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

  private isSessionValid(session: AuthSession): boolean {
    return session.expires_at > Date.now();
  }

  // Refresh session if needed
  async refreshSession(): Promise<AuthSession | null> {
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