import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>BizPilot Mobile</Text>
        <Text style={styles.subtitle}>Welcome to your business management app</Text>
        
        <View style={styles.features}>
          <Text style={styles.featureTitle}>Coming Soon:</Text>
          <Text style={styles.feature}>• Order Management</Text>
          <Text style={styles.feature}>• Customer Database</Text>
          <Text style={styles.feature}>• Financial Tracking</Text>
          <Text style={styles.feature}>• AI Business Assistant</Text>
        </View>
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#a78bfa',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 40,
  },
  features: {
    marginBottom: 40,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 16,
  },
  feature: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#a78bfa',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 