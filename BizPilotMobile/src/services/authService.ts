import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

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
      const { data: spData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.fullName, ...(data.metadata || {}) },
        },
      });

      if (error) {
        return {
          session: null,
          error: { message: error.message, code: error.name },
        };
      }

      // For some projects, signUp may require email verification and return no session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session && spData.user) {
        const spSession = sessionData.session;
        const spUser = spData.user as any;
        const mappedUser: AuthUser = {
          id: spUser.id,
          email: spUser.email,
          name: spUser.user_metadata?.full_name || spUser.user_metadata?.name,
          avatar_url: spUser.user_metadata?.avatar_url || undefined,
          created_at: spUser.created_at,
          last_sign_in: spUser.last_sign_in_at || new Date().toISOString(),
        };
        const mappedSession: BizPilotAuthSession = {
          access_token: spSession.access_token,
          refresh_token: spSession.refresh_token as string,
          expires_at: (spSession.expires_at || 0) * 1000,
          user: mappedUser,
        };
        await this.storeSession(mappedSession);
        this.session = mappedSession;
        return { session: mappedSession, error: null };
      }

      // No immediate session (email confirmation likely required)
      return { session: null, error: null };
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
      const { data: spData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return {
          session: null,
          error: { message: error.message, code: error.name },
        };
      }

      if (spData.session && spData.user) {
        const spSession = spData.session;
        const spUser = spData.user as any;
        const mappedUser: AuthUser = {
          id: spUser.id,
          email: spUser.email,
          name: spUser.user_metadata?.full_name || spUser.user_metadata?.name,
          avatar_url: spUser.user_metadata?.avatar_url || undefined,
          created_at: spUser.created_at,
          last_sign_in: spUser.last_sign_in_at || new Date().toISOString(),
        };
        const mappedSession: BizPilotAuthSession = {
          access_token: spSession.access_token,
          refresh_token: spSession.refresh_token as string,
          expires_at: (spSession.expires_at || 0) * 1000,
          user: mappedUser,
        };
        await this.storeSession(mappedSession, data.rememberMe);
        this.session = mappedSession;
        return { session: mappedSession, error: null };
      }

      return {
        session: null,
        error: { message: 'No session returned', code: 'signin_no_session' },
      };
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

  // OAuth sign in with expo-auth-session (Google OAuth)
  async signInWithOAuth(provider: string): Promise<{ session: BizPilotAuthSession | null; error: AuthError | null }> {
    try {
      if (provider !== 'google') {
        return {
          session: null,
          error: {
            message: 'Only Google OAuth is currently supported',
            code: 'oauth_provider_not_supported'
          }
        };
      }
      // Start OAuth via Supabase (PKCE). We'll open the returned URL and handle the deep link.
      const { deepLinkingService } = await import('./deepLinkingService');
      const redirectTo = deepLinkingService.generateOAuthRedirectUrl(provider);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: 'openid profile email',
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return {
          session: null,
          error: { message: error.message, code: error.name },
        };
      }

      if (!data?.url) {
        return {
          session: null,
          error: { message: 'Failed to start OAuth flow', code: 'oauth_start_failed' },
        };
      }

      // Open the provider login in a browser session and wait for redirect back
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !('url' in result) || !result.url) {
        return {
          session: null,
          error: { message: result.type === 'cancel' ? 'OAuth cancelled by user' : 'OAuth was dismissed', code: result.type === 'cancel' ? 'oauth_cancelled' : 'oauth_dismissed' },
        };
      }

      // Parse returned URL for code or tokens
      const returnedUrl = result.url as string;
      const query = returnedUrl.split('?')[1] || '';
      const params = new URLSearchParams(query);

      const oauthError = params.get('error');
      const oauthErrorDescription = params.get('error_description') || undefined;
      if (oauthError) {
        return { session: null, error: { message: oauthErrorDescription || oauthError, code: 'oauth_error' } };
      }

      const code = params.get('code');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (code) {
        const { data: spData, error: exError } = await supabase.auth.exchangeCodeForSession(code);
        if (exError) {
          return { session: null, error: { message: exError.message, code: exError.name } };
        }
        if (spData.session && spData.user) {
          const spSession = spData.session;
          const spUser = spData.user as any;
          const mappedUser: AuthUser = {
            id: spUser.id,
            email: spUser.email,
            name: spUser.user_metadata?.full_name || spUser.user_metadata?.name,
            avatar_url: spUser.user_metadata?.avatar_url || undefined,
            created_at: spUser.created_at,
            last_sign_in: spUser.last_sign_in_at || new Date().toISOString(),
          };
          const mappedSession: BizPilotAuthSession = {
            access_token: spSession.access_token,
            refresh_token: spSession.refresh_token as string,
            expires_at: (spSession.expires_at || 0) * 1000,
            user: mappedUser,
          };
          await this.storeSession(mappedSession);
          this.session = mappedSession;
          return { session: mappedSession, error: null };
        }
      }

      if (accessToken && refreshToken) {
        const { data: setData, error: setErr } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (setErr) {
          return { session: null, error: { message: setErr.message, code: setErr.name } };
        }
        if (setData.session && setData.user) {
          const spSession = setData.session;
          const spUser = setData.user as any;
          const mappedUser: AuthUser = {
            id: spUser.id,
            email: spUser.email,
            name: spUser.user_metadata?.full_name || spUser.user_metadata?.name,
            avatar_url: spUser.user_metadata?.avatar_url || undefined,
            created_at: spUser.created_at,
            last_sign_in: spUser.last_sign_in_at || new Date().toISOString(),
          };
          const mappedSession: BizPilotAuthSession = {
            access_token: spSession.access_token,
            refresh_token: spSession.refresh_token as string,
            expires_at: (spSession.expires_at || 0) * 1000,
            user: mappedUser,
          };
          await this.storeSession(mappedSession);
          this.session = mappedSession;
          return { session: mappedSession, error: null };
        }
      }

      return { session: null, error: { message: 'Authentication failed', code: 'oauth_incomplete' } };
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
      const redirectTo = 'bizpilot://reset-password';
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo });
      if (error) {
        return { error: { message: error.message, code: error.name } };
      }
      return { error: null };
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
      await supabase.auth.signOut();
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