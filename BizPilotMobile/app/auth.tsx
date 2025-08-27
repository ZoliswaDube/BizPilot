import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/auth';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { Card } from '../src/components/ui/Card';
import { authService } from '../src/services/authService';
import { deepLinkingService } from '../src/services/deepLinkingService';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, loading, error, clearError } = useAuthStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Clear errors when switching modes
  React.useEffect(() => {
    clearError();
  }, [mode, clearError]);

  const handleAuth = async () => {
    try {
      clearError();
      
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }
        if (password.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters long');
          return;
        }
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
      
      // Don't redirect immediately - let the auth store handle navigation
      // The index page will handle redirecting based on auth state
    } catch (error) {
      // Error is already handled by the auth store
      console.error('Auth error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const { session, error } = await authService.signInWithOAuth('google');
      if (error) {
        Alert.alert('Google Sign In Error', error.message);
        return;
      }
      if (session) {
        // Reinitialize auth state and navigate to intended destination (or dashboard)
        await useAuthStore.getState().initialize();
        await deepLinkingService.navigateToIntendedDestination();
      }
    } catch (error) {
      Alert.alert('Google Sign In Error', 'Failed to start Google sign in');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with biometrics',
        fallbackLabel: 'Use passcode',
      });
      
      if (result.success) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      Alert.alert('Biometric Error', 'Could not authenticate with biometrics');
    }
  };

  const getTitle = () => {
    return mode === 'signup' ? 'Create your account' : 'Welcome back';
  };

  const getSubtitle = () => {
    return mode === 'signup' 
      ? 'Start your journey with BizPilot today' 
      : 'Sign in to your BizPilot account';
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0f172a']}
        style={styles.background}
      >
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header with back button */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#a78bfa" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            {/* Logo and Title */}
            <View style={styles.header}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>BP</Text>
              </View>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>{getSubtitle()}</Text>
            </View>

            {/* Auth Form Card */}
            <View style={styles.formContainer}>
              <View style={styles.formCard}>
                {/* Auth Mode Tabs */}
                <View style={styles.tabs}>
                  <TouchableOpacity
                    style={[styles.tab, mode === 'signin' && styles.activeTab]}
                    onPress={() => setMode('signin')}
                  >
                    <Text style={[styles.tabText, mode === 'signin' && styles.activeTabText]}>
                      Sign In
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, mode === 'signup' && styles.activeTab]}
                    onPress={() => setMode('signup')}
                  >
                    <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Google OAuth Button */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                >
                  {googleLoading ? (
                    <Loader2 size={20} color="#9ca3af" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <Text style={styles.googleButtonText}>
                    {googleLoading ? 'Connecting...' : 'Continue with Google'}
                  </Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Email Form */}
                <View style={styles.form}>
                  {mode === 'signup' && (
                    <Input
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Full Name"
                      style={styles.input}
                    />
                  )}
                  
                  <Input
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  
                  <Input
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry
                    style={styles.input}
                  />
                  
                  {mode === 'signup' && (
                    <Input
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm Password"
                      secureTextEntry
                      style={styles.input}
                    />
                  )}

                  <Button
                    title={mode === 'signup' ? 'Create Account' : 'Sign In'}
                    onPress={handleAuth}
                    loading={loading}
                    style={styles.submitButton}
                  />

                  {mode === 'signin' && (
                    <TouchableOpacity style={styles.forgotPassword}>
                      <Text style={styles.forgotPasswordText}>
                        Forgot your password?
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Biometric Auth */}
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricAuth}
                >
                  <Text style={styles.biometricText}>Use Biometric Authentication</Text>
                </TouchableOpacity>
              </View>

              {/* Demo Access */}
              <TouchableOpacity 
                style={styles.demoButton}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.demoText}>Continue as Demo User</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Google Icon Component
const GoogleIcon = () => (
  <View style={styles.googleIcon}>
    <Text style={styles.googleIconText}>G</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  backText: {
    color: '#a78bfa',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 32,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#a78bfa',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#ffffff',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4285f4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#475569',
  },
  dividerText: {
    fontSize: 14,
    color: '#9ca3af',
    marginHorizontal: 16,
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 0,
  },
  submitButton: {
    marginTop: 8,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '500',
  },
  biometricButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  biometricText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  demoButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 16,
  },
  demoText: {
    color: '#6b7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  demoCredentials: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    borderColor: '#a78bfa',
    borderWidth: 1,
  },
  demoCredentialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a78bfa',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoCredentialItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 8,
  },
  demoCredentialEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  demoCredentialDesc: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
}); 