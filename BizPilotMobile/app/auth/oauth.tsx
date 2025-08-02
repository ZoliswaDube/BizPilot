import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { 
  ArrowLeft, 
  Shield,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { authService, OAuthProvider } from '../../src/services/authService';
import { deepLinkingService } from '../../src/services/deepLinkingService';
import { useAuthStore } from '../../src/store/auth';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/styles/theme';
import * as Haptics from 'expo-haptics';

WebBrowser.maybeCompleteAuthSession();

interface OAuthConfig {
  provider: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  clientId: string;
  scopes: string[];
}

export default function OAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signIn } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<OAuthProvider | null>(null);

  useEffect(() => {
    const providerId = params.provider as string;
    if (providerId) {
      const providers = authService.getOAuthProviders();
      const selectedProvider = providers.find(p => p.id === providerId);
      setProvider(selectedProvider || null);
    }
  }, [params.provider]);

  const getOAuthConfig = (providerId: string): OAuthConfig | null => {
    switch (providerId) {
      case 'google':
        return {
          provider: 'google',
          authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
          tokenEndpoint: 'https://oauth2.googleapis.com/token',
          clientId: 'your-google-client-id', // Replace with actual client ID
          scopes: ['openid', 'profile', 'email'],
        };
      case 'apple':
        return {
          provider: 'apple',
          authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
          tokenEndpoint: 'https://appleid.apple.com/auth/token',
          clientId: 'your-apple-client-id', // Replace with actual client ID
          scopes: ['name', 'email'],
        };
      case 'facebook':
        return {
          provider: 'facebook',
          authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
          tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
          clientId: 'your-facebook-app-id', // Replace with actual app ID
          scopes: ['public_profile', 'email'],
        };
      default:
        return null;
    }
  };

  const handleOAuthSignIn = async () => {
    if (!provider) return;

    try {
      setLoading(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const config = getOAuthConfig(provider.id);
      if (!config) {
        throw new Error(`OAuth configuration not found for ${provider.name}`);
      }

      // Generate redirect URI
      const redirectUri = deepLinkingService.generateOAuthRedirectUrl(provider.id);

      // Create OAuth request
      const request = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        state: AuthSession.AuthRequest.makeRandomState(),
        extraParams: {},
      });

      // Start OAuth flow
      const result = await request.promptAsync({
        authorizationEndpoint: config.authorizationEndpoint,
        useProxy: true,
      });

      if (result.type === 'success') {
        // Handle successful OAuth response
        await processOAuthResult(result, config);
      } else if (result.type === 'cancel') {
        setError('Authentication was cancelled');
      } else if (result.type === 'error') {
        setError(result.error?.message || 'OAuth authentication failed');
      }
    } catch (err) {
      console.error('OAuth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } finally {
      setLoading(false);
    }
  };

  const processOAuthResult = async (result: any, config: OAuthConfig) => {
    try {
      // In a real implementation, you would exchange the code for tokens
      // For now, we'll simulate a successful OAuth flow
      
      const { session, error } = await authService.signInWithOAuth(config.provider);
      
      if (error) {
        throw new Error(error.message);
      }

      if (session) {
        await signIn(session.user, session);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Navigate to intended destination or dashboard
        await deepLinkingService.navigateToIntendedDestination();
      }
    } catch (err) {
      throw err;
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTryAgain = () => {
    setError(null);
    handleOAuthSignIn();
  };

  if (!provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <ArrowLeft size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>OAuth Authentication</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.errorCard}>
            <AlertCircle size={48} color={theme.colors.red[500]} />
            <Text style={styles.errorTitle}>Provider Not Found</Text>
            <Text style={styles.errorMessage}>
              The requested OAuth provider is not available.
            </Text>
            <Button
              variant="primary"
              onPress={handleCancel}
              style={styles.button}
            >
              Go Back
            </Button>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <ArrowLeft size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign in with {provider.name}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {error ? (
          <Card style={styles.errorCard}>
            <AlertCircle size={48} color={theme.colors.red[500]} />
            <Text style={styles.errorTitle}>Authentication Failed</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <View style={styles.buttonContainer}>
              <Button
                variant="secondary"
                onPress={handleCancel}
                style={[styles.button, styles.cancelButton]}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleTryAgain}
                style={styles.button}
              >
                Try Again
              </Button>
            </View>
          </Card>
        ) : (
          <Card style={styles.providerCard}>
            <View style={[styles.providerIcon, { backgroundColor: provider.color }]}>
              <Text style={styles.providerIconText}>
                {provider.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            
            <Text style={styles.providerTitle}>
              Continue with {provider.name}
            </Text>
            
            <Text style={styles.providerDescription}>
              Sign in to BizPilot using your {provider.name} account. 
              This will securely authenticate you and sync your profile information.
            </Text>

            <View style={styles.securityInfo}>
              <Shield size={20} color={theme.colors.green[500]} />
              <Text style={styles.securityText}>
                Your data is encrypted and secure
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                <Text style={styles.loadingText}>
                  Connecting to {provider.name}...
                </Text>
              </View>
            ) : (
              <Button
                variant="primary"
                onPress={handleOAuthSignIn}
                style={styles.signInButton}
              >
                Sign in with {provider.name}
              </Button>
            )}

            <TouchableOpacity onPress={handleCancel} style={styles.cancelLink}>
              <Text style={styles.cancelLinkText}>
                Use email instead
              </Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Privacy Notice */}
        <Card style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Privacy & Security</Text>
          <Text style={styles.privacyText}>
            By continuing, you agree to BizPilot's Terms of Service and Privacy Policy. 
            We'll only access basic profile information needed for your account.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark[800],
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  providerCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  providerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  providerIconText: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  providerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  providerDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  securityText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.green[400],
    marginLeft: theme.spacing.sm,
    fontWeight: theme.fontWeight.medium,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.md,
  },
  signInButton: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  cancelLink: {
    paddingVertical: theme.spacing.md,
  },
  cancelLinkText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary[500],
    textAlign: 'center',
  },
  errorCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.red[400],
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    marginRight: theme.spacing.sm,
  },
  privacyCard: {
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  privacyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  privacyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    lineHeight: 20,
  },
}); 