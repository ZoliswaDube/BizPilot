import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

export interface DeepLinkRoute {
  screen: string;
  params?: Record<string, string>;
}

export interface AuthCallbackData {
  provider?: string;
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

export interface PasswordResetData {
  token?: string;
  error?: string;
}

export class DeepLinkingService {
  private static instance: DeepLinkingService;
  private initialized = false;
  private linkingListener: any;

  static getInstance(): DeepLinkingService {
    if (!DeepLinkingService.instance) {
      DeepLinkingService.instance = new DeepLinkingService();
    }
    return DeepLinkingService.instance;
  }

  // Initialize deep linking
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get the initial URL if app was opened via deep link
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await this.handleDeepLink(initialUrl);
      }

      // Listen for incoming deep links while app is running
      this.linkingListener = Linking.addEventListener('url', ({ url }) => {
        this.handleDeepLink(url);
      });

      this.initialized = true;
      console.log('Deep linking service initialized');
    } catch (error) {
      console.error('Error initializing deep linking:', error);
    }
  }

  // Cleanup deep linking
  cleanup(): void {
    if (this.linkingListener) {
      this.linkingListener.remove();
      this.linkingListener = null;
    }
    this.initialized = false;
  }

  // Handle deep link URLs
  private async handleDeepLink(url: string): Promise<void> {
    try {
      console.log('Handling deep link:', url);

      const parsed = Linking.parse(url);
      const { hostname, path, queryParams } = parsed;

      // Handle authentication callbacks
      if (hostname === 'auth' || path?.startsWith('/auth')) {
        await this.handleAuthCallback(queryParams);
        return;
      }

      // Handle password reset
      if (hostname === 'reset-password' || path?.includes('reset-password')) {
        await this.handlePasswordReset(queryParams);
        return;
      }

      // Handle email verification
      if (hostname === 'verify' || path?.includes('verify')) {
        await this.handleEmailVerification(queryParams);
        return;
      }

      // Handle app navigation
      await this.handleAppNavigation(parsed);
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  // Handle OAuth authentication callbacks
  private async handleAuthCallback(params: Record<string, string>): Promise<void> {
    try {
      const callbackData: AuthCallbackData = {
        provider: params.provider,
        access_token: params.access_token,
        refresh_token: params.refresh_token,
        error: params.error,
        error_description: params.error_description,
      };

      if (callbackData.error) {
        // Handle OAuth error
        console.error('OAuth error:', callbackData.error, callbackData.error_description);
        router.push({
          pathname: '/auth/error',
          params: {
            error: callbackData.error,
            description: callbackData.error_description || 'OAuth authentication failed',
          },
        });
        return;
      }

      if (callbackData.access_token && callbackData.provider) {
        // Store temporary OAuth data for processing
        await AsyncStorage.setItem('oauth_callback_data', JSON.stringify(callbackData));
        
        // Navigate to OAuth processing screen
        router.push({
          pathname: '/auth/callback',
          params: { provider: callbackData.provider },
        });
        return;
      }

      // Invalid callback data
      router.push({
        pathname: '/auth/error',
        params: {
          error: 'invalid_callback',
          description: 'Invalid authentication callback data',
        },
      });
    } catch (error) {
      console.error('Error handling auth callback:', error);
      router.push('/auth/error');
    }
  }

  // Handle password reset links
  private async handlePasswordReset(params: Record<string, string>): Promise<void> {
    try {
      const resetData: PasswordResetData = {
        token: params.token,
        error: params.error,
      };

      if (resetData.error) {
        router.push({
          pathname: '/auth/error',
          params: {
            error: resetData.error,
            description: 'Password reset link is invalid or expired',
          },
        });
        return;
      }

      if (resetData.token) {
        router.push({
          pathname: '/auth/reset-password',
          params: { token: resetData.token },
        });
        return;
      }

      // No token provided
      router.push({
        pathname: '/auth/error',
        params: {
          error: 'missing_token',
          description: 'Password reset token is missing',
        },
      });
    } catch (error) {
      console.error('Error handling password reset:', error);
      router.push('/auth/error');
    }
  }

  // Handle email verification links
  private async handleEmailVerification(params: Record<string, string>): Promise<void> {
    try {
      const token = params.token;
      const error = params.error;

      if (error) {
        router.push({
          pathname: '/auth/error',
          params: {
            error,
            description: 'Email verification failed',
          },
        });
        return;
      }

      if (token) {
        // Process email verification
        // In a real implementation, this would verify the token with the backend
        
        router.push({
          pathname: '/auth',
          params: {
            verified: 'true',
            message: 'Email verified successfully',
          },
        });
        return;
      }

      router.push({
        pathname: '/auth/error',
        params: {
          error: 'missing_token',
          description: 'Email verification token is missing',
        },
      });
    } catch (error) {
      console.error('Error handling email verification:', error);
      router.push('/auth/error');
    }
  }

  // Handle general app navigation
  private async handleAppNavigation(parsed: any): Promise<void> {
    try {
      const { hostname, path, queryParams } = parsed;

      // Check if user is authenticated for protected routes
      const session = authService.getSession();
      const protectedRoutes = ['/dashboard', '/products', '/inventory', '/ai-chat'];

      const targetPath = path || `/${hostname}`;
      
      if (protectedRoutes.some(route => targetPath.startsWith(route))) {
        if (!session) {
          // Store intended destination for after login
          await AsyncStorage.setItem('intended_destination', JSON.stringify({
            path: targetPath,
            params: queryParams,
          }));
          
          router.push('/auth');
          return;
        }
      }

      // Navigate to the target screen
      if (queryParams && Object.keys(queryParams).length > 0) {
        router.push({
          pathname: targetPath,
          params: queryParams,
        });
      } else {
        router.push(targetPath);
      }
    } catch (error) {
      console.error('Error handling app navigation:', error);
      // Fallback to home or auth screen
      const session = authService.getSession();
      router.push(session ? '/dashboard' : '/auth');
    }
  }

  // Navigate to intended destination after successful auth
  async navigateToIntendedDestination(): Promise<void> {
    try {
      const destinationData = await AsyncStorage.getItem('intended_destination');
      if (destinationData) {
        const destination = JSON.parse(destinationData);
        await AsyncStorage.removeItem('intended_destination');
        
        if (destination.params && Object.keys(destination.params).length > 0) {
          router.push({
            pathname: destination.path,
            params: destination.params,
          });
        } else {
          router.push(destination.path);
        }
      } else {
        // Default to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error navigating to intended destination:', error);
      router.push('/dashboard');
    }
  }

  // Get OAuth callback data
  async getOAuthCallbackData(): Promise<AuthCallbackData | null> {
    try {
      const data = await AsyncStorage.getItem('oauth_callback_data');
      if (data) {
        await AsyncStorage.removeItem('oauth_callback_data');
        return JSON.parse(data);
      }
      return null;
    } catch {
      return null;
    }
  }

  // Generate share links
  generateShareLink(type: 'product' | 'qr-code' | 'business', id: string): string {
    const baseUrl = 'bizpilot://';
    
    switch (type) {
      case 'product':
        return `${baseUrl}products/${id}`;
      case 'qr-code':
        return `${baseUrl}qr/${id}`;
      case 'business':
        return `${baseUrl}business/${id}`;
      default:
        return baseUrl;
    }
  }

  // Generate OAuth redirect URL
  generateOAuthRedirectUrl(provider: string): string {
    return `bizpilot://auth?provider=${provider}`;
  }

  // Generate password reset URL
  generatePasswordResetUrl(token: string): string {
    return `bizpilot://reset-password?token=${token}`;
  }

  // Generate email verification URL
  generateEmailVerificationUrl(token: string): string {
    return `bizpilot://verify?token=${token}`;
  }

  // Open external URL
  async openExternalUrl(url: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Open app settings
  async openAppSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening app settings:', error);
    }
  }

  // Open email client
  async openEmailClient(email: string, subject?: string, body?: string): Promise<void> {
    try {
      let url = `mailto:${email}`;
      const params = [];
      
      if (subject) {
        params.push(`subject=${encodeURIComponent(subject)}`);
      }
      
      if (body) {
        params.push(`body=${encodeURIComponent(body)}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      await this.openExternalUrl(url);
    } catch (error) {
      console.error('Error opening email client:', error);
    }
  }

  // Open phone dialer
  async openPhoneDialer(phoneNumber: string): Promise<void> {
    try {
      const url = `tel:${phoneNumber}`;
      await this.openExternalUrl(url);
    } catch (error) {
      console.error('Error opening phone dialer:', error);
    }
  }
}

// Export singleton instance
export const deepLinkingService = DeepLinkingService.getInstance(); 