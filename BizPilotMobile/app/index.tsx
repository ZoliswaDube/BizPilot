import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth';
import { LoadingScreen } from '../src/components/LoadingScreen';

export default function Index() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth" />;
} 