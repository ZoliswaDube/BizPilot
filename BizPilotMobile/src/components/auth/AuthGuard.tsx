import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireBusiness?: boolean;
}

export default function AuthGuard({ children, requireBusiness = true }: AuthGuardProps) {
  const router = useRouter();
  const { user, business, loading, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth initialization to complete
    if (loading || isLoading) return;

    // If no user, redirect to auth
    if (!user) {
      router.replace('/auth');
      return;
    }

    // If business is required but user has no business, redirect to onboarding
    if (requireBusiness && !business) {
      router.replace('/business-onboarding');
      return;
    }
  }, [user, business, loading, isLoading, requireBusiness, router]);

  // Show loading while checking auth status
  if (loading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  // If no user, don't render children (will redirect)
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </View>
    );
  }

  // If business is required but user has no business, don't render children
  if (requireBusiness && !business) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Setting up your business...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },
  loadingText: {
    fontSize: 16,
    color: '#a78bfa',
    fontWeight: '600',
  },
});
