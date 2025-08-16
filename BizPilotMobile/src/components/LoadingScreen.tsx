import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary[500]} 
        style={styles.spinner}
      />
      <Text style={styles.text}>Loading BizPilot...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.dark[950],
  },
  spinner: {
    marginBottom: theme.spacing.lg,
  },
  text: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
    fontFamily: theme.fontFamily.sans,
  },
}); 