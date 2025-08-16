import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Star, Shield, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/auth';

export default function Index() {
  const router = useRouter();
  const { user, business, loading } = useAuthStore();
  const [checkingBusiness, setCheckingBusiness] = useState(true);

  useEffect(() => {
    const checkBusinessStatus = async () => {
      if (loading) return;
      
      if (user && !business) {
        // User is logged in but has no business - redirect to business onboarding
        router.replace('/business-onboarding');
        return;
      }
      
      if (user && business) {
        // User has business - redirect to main app
        router.replace('/(tabs)');
        return;
      }
      
      setCheckingBusiness(false);
    };

    checkBusinessStatus();
  }, [user, business, loading]);

  const handleGetStarted = () => {
    router.push('/auth');
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Smart Analytics',
      description: 'Make data-driven decisions with powerful insights'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your business data is protected with enterprise-grade security'
    },
    {
      icon: Star,
      title: 'AI-Powered',
      description: 'Get intelligent recommendations for your business'
    }
  ];

  if (checkingBusiness || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#020617', '#0f172a', '#1e293b']}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading BizPilot...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0f172a', '#1e293b']}
        style={styles.background}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>BP</Text>
              </View>
            </View>
            <Text style={styles.title}>BizPilot</Text>
            <Text style={styles.subtitle}>
              Transform your business with AI-powered insights and streamlined operations
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Everything you need to grow</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <feature.icon size={24} color="#a78bfa" />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Core Features List */}
          <View style={styles.coreFeatures}>
            <Text style={styles.coreFeaturesTitle}>Core Features</Text>
            <View style={styles.featuresList}>
              {[
                'Order Management & Tracking',
                'Customer Database & CRM',
                'Financial Tracking & Reports',
                'AI Business Assistant',
                'Product & Inventory Management',
                'Smart Pricing & Analytics'
              ].map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CTA Buttons */}
          <View style={styles.ctaSection}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleGetStarted}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#a78bfa', '#9333ea']}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Start Your Free Trial</Text>
                <ArrowRight size={18} color="#ffffff" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>View Demo</Text>
            </TouchableOpacity>

            <Text style={styles.trialNote}>
              No credit card required • 14-day free trial
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#a78bfa',
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  featuresSection: {
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#a78bfa20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  coreFeatures: {
    marginBottom: 40,
  },
  coreFeaturesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a78bfa',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#e5e7eb',
    flex: 1,
  },
  ctaSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  primaryButton: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#1e293b80',
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  trialNote: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
}); 