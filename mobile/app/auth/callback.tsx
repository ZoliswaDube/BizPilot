import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { deepLinkingService } from '../../src/services/deepLinkingService';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/styles/theme';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        // Fallback handling for implicit grant-style callbacks (rare)
        const data = await deepLinkingService.getOAuthCallbackData();
        if (!data) {
          setError('No OAuth data was provided. You can close this page.');
          return;
        }
        if (data.error) {
          setError(data.error_description || data.error);
          return;
        }
        if (data.access_token && data.refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
          if (setErr) {
            setError(setErr.message);
            return;
          }
          // hydrate auth store and navigate
          await useAuthStore.getState().initialize();
          await deepLinkingService.navigateToIntendedDestination();
        } else {
          setError('Missing tokens in OAuth callback.');
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to complete OAuth.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <Card style={styles.card}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.title}>Completing sign-in…</Text>
            <Text style={styles.subtitle}>Please wait while we finalize authentication.</Text>
          </Card>
        ) : error ? (
          <Card style={styles.card}>
            <Text style={styles.errorTitle}>OAuth Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button variant="primary" onPress={() => router.replace('/auth')} style={styles.button}>
              Back to Sign In
            </Button>
          </Card>
        ) : null}
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
  },
});
