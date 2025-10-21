import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/auth';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { Card } from '../src/components/ui/Card';
import { mcp_supabase_execute_sql } from '../src/services/mcpClient';

interface BusinessFormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export default function BusinessOnboarding() {
  const router = useRouter();
  const { user, refreshProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: user?.email || '',
    website: ''
  });

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found. Please sign in again.');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Business name is required.');
      return;
    }

    setLoading(true);

    try {
      // Check if user is already associated with any business
      const existingBusinessResult = await mcp_supabase_execute_sql({
        query: `
          SELECT business_id, role 
          FROM business_users 
          WHERE user_id = $1 AND is_active = true
        `,
        params: [user.id]
      });

      if (existingBusinessResult.success && existingBusinessResult.data?.length > 0) {
        Alert.alert(
          'Already Associated', 
          'You are already associated with a business. Each user can only be part of one business.'
        );
        setLoading(false);
        return;
      }

      // Create the business
      const businessResult = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO businesses (
            name, description, address, phone, email, website, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, name
        `,
        params: [
          formData.name,
          formData.description,
          formData.address,
          formData.phone,
          formData.email,
          formData.website,
          user.id
        ]
      });

      if (!businessResult.success || !businessResult.data?.[0]?.id) {
        throw new Error('Failed to create business');
      }

      const business = businessResult.data[0];

      // Add the user as the admin/owner of the business
      await mcp_supabase_execute_sql({
        query: `
          INSERT INTO business_users (
            business_id, user_id, role, is_active, accepted_at, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        params: [
          business.id,
          user.id,
          'admin',
          true,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      });

      // Update user profile with business_id
      await mcp_supabase_execute_sql({
        query: `
          UPDATE user_profiles 
          SET business_id = $1 
          WHERE user_id = $2
        `,
        params: [business.id, user.id]
      });

      setSuccess(true);
      
      // Refresh the user's profile and business data
      await refreshProfile();
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);

    } catch (err) {
      console.error('Error creating business:', err);
      Alert.alert(
        'Creation Failed', 
        'Failed to create business. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const skipForNow = () => {
    Alert.alert(
      'Skip Business Setup?',
      'You can always set up your business later in Settings. Continue to dashboard?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => router.replace('/(tabs)') }
      ]
    );
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#020617', '#0f172a']}
          style={styles.background}
        >
          <View style={styles.successContainer}>
            <Card style={styles.successCard}>
              <View style={styles.successIcon}>
                <CheckCircle size={48} color="#22c55e" />
              </View>
              <Text style={styles.successTitle}>Business Created!</Text>
              <Text style={styles.successMessage}>
                Your business has been successfully created. Redirecting to your dashboard...
              </Text>
              <View style={styles.loadingContainer}>
                <Loader2 size={24} color="#a78bfa" />
              </View>
            </Card>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0f172a']}
        style={styles.background}
      >
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#a78bfa" />
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <Building2 size={48} color="#a78bfa" />
              </View>
              <Text style={styles.title}>Set Up Your Business</Text>
              <Text style={styles.subtitle}>
                Create your business profile to get started with BizPilot
              </Text>
            </View>

            {/* Form */}
            <Card style={styles.formCard}>
              <View style={styles.form}>
                <Input
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Business Name *"
                  style={styles.input}
                />

                <Input
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  placeholder="Business Description"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />

                <Input
                  value={formData.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  placeholder="Business Address"
                  style={styles.input}
                />

                <Input
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  style={styles.input}
                />

                <Input
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Business Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <Input
                  value={formData.website}
                  onChangeText={(value) => handleInputChange('website', value)}
                  placeholder="Website (optional)"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <Button
                  title="Create Business"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={!formData.name.trim()}
                  style={styles.submitButton}
                />

                <Button
                  title="Skip for Now"
                  onPress={skipForNow}
                  variant="ghost"
                  style={styles.skipButton}
                />
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#a78bfa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    maxWidth: 280,
  },
  formCard: {
    marginBottom: 20,
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
  skipButton: {
    marginTop: 8,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successCard: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    padding: 12,
  },
}); 