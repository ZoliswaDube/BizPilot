import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { authService, AuthError, BizPilotAuthSession } from '../services/authService';

// Complete auth session for WebBrowser
WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthResult {
  session: BizPilotAuthSession | null;
  error: AuthError | null;
}

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
    try {
      setIsLoading(true);

      // Get Google OAuth client ID from environment
      const clientId = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
      if (!clientId) {
        return {
          session: null,
          error: {
            message: 'Google OAuth client ID not configured. Please add EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID to your environment variables.',
            code: 'oauth_config_missing'
          }
        };
      }

      // Create redirect URI for Expo
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'exp',
        path: 'oauth'
      });

      console.log('Google OAuth Config:');
      console.log('Client ID:', clientId);
      console.log('Redirect URI:', redirectUri);

      // Build Google OAuth URL
      const authParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        access_type: 'offline',
        prompt: 'consent',
      });

      const authorizationUrl = `https://accounts.google.com/oauth/authorize?${authParams.toString()}`;

      // Start OAuth flow using WebBrowser
      const result = await WebBrowser.openAuthSessionAsync(
        authorizationUrl,
        redirectUri
      );

      if (result.type !== 'success') {
        return {
          session: null,
          error: {
            message: result.type === 'cancel' ? 'OAuth cancelled by user' : 'OAuth authentication failed',
            code: result.type === 'cancel' ? 'oauth_cancelled' : 'oauth_failed'
          }
        };
      }

      // Parse the returned URL to get the authorization code
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      
      if (error) {
        return {
          session: null,
          error: {
            message: `OAuth error: ${error}`,
            code: 'oauth_server_error'
          }
        };
      }

      if (!code) {
        return {
          session: null,
          error: {
            message: 'Authorization code not found in OAuth response',
            code: 'oauth_code_missing'
          }
        };
      }

      // Exchange code for tokens
      const tokenParams = new URLSearchParams({
        client_id: clientId,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        return {
          session: null,
          error: {
            message: tokenData.error_description || 'Failed to exchange authorization code for tokens',
            code: 'oauth_token_exchange_failed'
          }
        };
      }

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        return {
          session: null,
          error: {
            message: 'Failed to get user information from Google',
            code: 'oauth_userinfo_failed'
          }
        };
      }

      const userInfo = await userInfoResponse.json();

      // Create session with Google user data
      const session: BizPilotAuthSession = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || '',
        expires_at: Date.now() + (tokenData.expires_in * 1000),
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          avatar_url: userInfo.picture,
          created_at: new Date().toISOString(),
          last_sign_in: new Date().toISOString(),
        }
      };

      // Store session in auth service
      const authResult = await authService.storeGoogleSession(session);
      
      return authResult;
    } catch (error) {
      return {
        session: null,
        error: {
          message: error instanceof Error ? error.message : 'Google OAuth authentication failed',
          code: 'oauth_error'
        }
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    isLoading,
  };
};
