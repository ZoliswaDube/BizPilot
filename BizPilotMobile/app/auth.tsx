import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '../src/store/auth';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { Card } from '../src/components/ui/Card';
import { theme } from '../src/styles/theme';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, loading } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async () => {
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Error', 'Biometric authentication not available');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Error', 'No biometric data enrolled');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with biometrics',
        fallbackLabel: 'Use password',
      });

      if (result.success) {
        // In a real app, you'd retrieve stored credentials
        Alert.alert('Success', 'Biometric authentication successful');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>BizPilot</Text>
          <Text style={styles.subtitle}>Business Management on Mobile</Text>
        </View>

        <Card style={styles.authCard}>
          <Text style={styles.authTitle}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>

          {isSignUp && (
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              containerStyle={styles.input}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          )}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            containerStyle={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            containerStyle={styles.input}
            placeholder="Enter your password"
            secureTextEntry
          />

          {isSignUp && (
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              containerStyle={styles.input}
              placeholder="Confirm your password"
              secureTextEntry
            />
          )}

          <Button
            title={isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleAuth}
            loading={loading}
            style={styles.authButton}
          />

          {!isSignUp && (
            <Button
              title="Use Biometric Authentication"
              onPress={handleBiometricAuth}
              variant="secondary"
              style={styles.biometricButton}
            />
          )}

          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            style={styles.switchAuth}
          >
            <Text style={styles.switchAuthText}>
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </Text>
          </TouchableOpacity>
        </Card>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize['4xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[100],
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.gray[400],
    textAlign: 'center',
  },
  authCard: {
    padding: theme.spacing.xl,
  },
  authTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[100],
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  authButton: {
    marginTop: theme.spacing.lg,
  },
  biometricButton: {
    marginTop: theme.spacing.md,
  },
  switchAuth: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  switchAuthText: {
    color: theme.colors.primary[500],
    fontSize: theme.fontSize.sm,
  },
}); 