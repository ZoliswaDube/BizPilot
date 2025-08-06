import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Building2, 
  ArrowLeft, 
  Save, 
  Camera, 
  Globe, 
  MapPin, 
  Phone, 
  Mail,
  DollarSign,
  Percent
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/auth';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { Card } from '../src/components/ui/Card';
import { mcp_supabase_execute_sql } from '../src/services/mcpClient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

interface BusinessFormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url?: string;
  hourly_rate: string;
  tax_rate: string;
  currency: string;
}

export default function BusinessProfile() {
  const router = useRouter();
  const { user, business, refreshProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: business?.name || '',
    description: business?.description || '',
    address: business?.address || '',
    phone: business?.phone || '',
    email: business?.email || '',
    website: business?.website || '',
    logo_url: business?.logo_url || '',
    hourly_rate: '50.00',
    tax_rate: '10.0',
    currency: 'USD'
  });
  const [imageUri, setImageUri] = useState<string | null>(business?.logo_url || null);

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        description: business.description || '',
        address: business.address || '',
        phone: business.phone || '',
        email: business.email || '',
        website: business.website || '',
        logo_url: business.logo_url || '',
        hourly_rate: '50.00',
        tax_rate: '10.0',
        currency: 'USD'
      });
      setImageUri(business.logo_url);
    }
  }, [business]);

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setFormData(prev => ({ ...prev, logo_url: result.assets[0].uri }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setFormData(prev => ({ ...prev, logo_url: result.assets[0].uri }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Business Logo',
      'Choose how to add your business logo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSave = async () => {
    if (!user || !business) {
      Alert.alert('Error', 'Business information not found');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Business name is required.');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Update business information
      await mcp_supabase_execute_sql({
        query: `
          UPDATE businesses 
          SET 
            name = $1,
            description = $2,
            address = $3,
            phone = $4,
            email = $5,
            website = $6,
            logo_url = $7,
            updated_at = $8
          WHERE id = $9
        `,
        params: [
          formData.name,
          formData.description,
          formData.address,
          formData.phone,
          formData.email,
          formData.website,
          formData.logo_url,
          new Date().toISOString(),
          business.id
        ]
      });

      // Update business settings/preferences
      await mcp_supabase_execute_sql({
        query: `
          INSERT INTO business_settings (
            business_id, hourly_rate, tax_rate, currency, updated_at
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (business_id) DO UPDATE SET
            hourly_rate = $2,
            tax_rate = $3,
            currency = $4,
            updated_at = $5
        `,
        params: [
          business.id,
          parseFloat(formData.hourly_rate) || 50.0,
          parseFloat(formData.tax_rate) || 10.0,
          formData.currency,
          new Date().toISOString()
        ]
      });

      await refreshProfile();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Business profile updated successfully!');
      router.back();

    } catch (err) {
      console.error('Error updating business:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Update Failed', 
        'Failed to update business profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#a78bfa" />
            </TouchableOpacity>
            <Text style={styles.title}>Business Profile</Text>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
              <Save size={24} color={loading ? '#6b7280' : '#a78bfa'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Logo Section */}
            <Card style={styles.logoCard}>
              <Text style={styles.sectionTitle}>Business Logo</Text>
              <TouchableOpacity style={styles.logoContainer} onPress={showImageOptions}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.logoImage} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Building2 size={32} color="#a78bfa" />
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  <Camera size={16} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </Card>

            {/* Basic Information */}
            <Card style={styles.formCard}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputGroup}>
                <Building2 size={20} color="#a78bfa" style={styles.inputIcon} />
                <Input
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Business Name *"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <Input
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  placeholder="Tell us about your business"
                  multiline
                  numberOfLines={3}
                  style={styles.textareaInput}
                />
              </View>
            </Card>

            {/* Contact Information */}
            <Card style={styles.formCard}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <View style={styles.inputGroup}>
                <MapPin size={20} color="#a78bfa" style={styles.inputIcon} />
                <Input
                  value={formData.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  placeholder="Business Address"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Phone size={20} color="#a78bfa" style={styles.inputIcon} />
                <Input
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Mail size={20} color="#a78bfa" style={styles.inputIcon} />
                <Input
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Business Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Globe size={20} color="#a78bfa" style={styles.inputIcon} />
                <Input
                  value={formData.website}
                  onChangeText={(value) => handleInputChange('website', value)}
                  placeholder="Website (optional)"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </Card>

            {/* Business Settings */}
            <Card style={styles.formCard}>
              <Text style={styles.sectionTitle}>Business Settings</Text>
              
              <View style={styles.inputGroup}>
                <DollarSign size={20} color="#a78bfa" style={styles.inputIcon} />
                <Input
                  value={formData.hourly_rate}
                  onChangeText={(value) => handleInputChange('hourly_rate', value)}
                  placeholder="Hourly Rate"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Percent size={20} color="#a78bfa" style={styles.inputIcon} />
                <Input
                  value={formData.tax_rate}
                  onChangeText={(value) => handleInputChange('tax_rate', value)}
                  placeholder="Tax Rate (%)"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Currency</Text>
                <Input
                  value={formData.currency}
                  onChangeText={(value) => handleInputChange('currency', value)}
                  placeholder="Currency (USD, EUR, etc.)"
                  autoCapitalize="characters"
                  style={styles.input}
                />
              </View>
            </Card>

            {/* Save Button */}
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              style={styles.saveButtonBottom}
            />

            <View style={styles.bottomSpacing} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoCard: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  logoContainer: {
    position: 'relative',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a78bfa',
    borderStyle: 'dashed',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 8,
  },
  input: {
    paddingLeft: 44,
  },
  textareaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButtonBottom: {
    marginTop: 24,
    marginBottom: 16,
  },
  bottomSpacing: {
    height: 20,
  },
}); 