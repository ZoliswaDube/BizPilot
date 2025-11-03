import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/styles/theme';

export default function AuthErrorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const error = (params.error as string) || 'Authentication Error';
  const description = (params.description as string) || 'Something went wrong during authentication.';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.description}>{description}</Text>
          <Button variant="primary" onPress={() => router.replace('/auth')} style={styles.button}>
            Back to Sign In
          </Button>
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
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  error: {
    color: theme.colors.red[400],
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  description: {
    color: theme.colors.gray[300],
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  button: {
    width: '100%',
  },
});
