import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { theme } from '../../src/styles/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const prepareSession = async () => {
      try {
        setLoading(true);
        setError(null);
        // Try to load recovery tokens saved by deepLinkingService
        const tokensRaw = await AsyncStorage.getItem('password_reset_tokens');
        if (tokensRaw) {
          const { access_token, refresh_token } = JSON.parse(tokensRaw);
          if (access_token) {
            const { error: setErr } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (setErr) {
              setError(setErr.message);
            } else {
              setSessionReady(true);
            }
          }
        } else if (params.token) {
          // Fallback: token param present but no access_token available
          // Supabase recovery now uses access_token; ask user to request a new email if token-only link was used
          setError('This reset link is outdated. Please request a new password reset email and open it on this device.');
        } else {
          setError('No password reset token found.');
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to prepare password reset.');
      } finally {
        setLoading(false);
      }
    };
    prepareSession();
  }, [params.token]);

  const canSubmit = sessionReady && password.length >= 8 && password === confirm && !loading;

  const handleSubmit = async () => {
    try {
      if (!canSubmit) return;
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw new Error(error.message);
      }

      // Clear temp tokens
      await AsyncStorage.removeItem('password_reset_tokens');

      // Rehydrate store from current Supabase session
      await useAuthStore.getState().initialize();

      Alert.alert('Password Updated', 'Your password has been updated successfully.', [
        { text: 'Continue', onPress: () => router.replace('/dashboard') },
      ]);
    } catch (e: any) {
      setError(e?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <Card style={styles.card}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.title}>Preparing reset…</Text>
            <Text style={styles.subtitle}>Please wait while we verify your link.</Text>
          </Card>
        ) : error ? (
          <Card style={styles.card}>
            <Text style={styles.errorTitle}>Password Reset</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button variant="primary" onPress={() => router.replace('/auth')} style={styles.button}>
              Back to Sign In
            </Button>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.title}>Set a new password</Text>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              secureTextEntry
              style={styles.input}
            />
            <Input
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm new password"
              secureTextEntry
              style={styles.input}
            />
            <Text style={styles.hint}>Password must be at least 8 characters.</Text>
            <Button
              variant="primary"
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={styles.button}
            >
              Update Password
            </Button>
          </Card>
        )}
      </View>
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
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    marginTop: theme.spacing.lg,
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    color: theme.colors.gray[400],
    fontSize: theme.fontSize.md,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },
  hint: {
    width: '100%',
    color: theme.colors.gray[400],
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    color: theme.colors.red[400],
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.gray[300],
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  button: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },
});
