import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

interface GoogleLoginButtonProps {
  onSuccess?: (session: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
  style?: any;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  style
}) => {
  const { signInWithGoogle, isLoading } = useGoogleAuth();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      
      if (result.error) {
        // Show user-friendly error message
        let errorMessage = 'Failed to sign in with Google';
        
        switch (result.error.code) {
          case 'oauth_config_missing':
            errorMessage = 'Google login is not configured. Please contact support.';
            break;
          case 'oauth_cancelled':
            errorMessage = 'Google login was cancelled';
            break;
          case 'oauth_failed':
            errorMessage = 'Google login failed. Please try again.';
            break;
          default:
            errorMessage = result.error.message || errorMessage;
        }
        
        Alert.alert('Login Failed', errorMessage);
        onError?.(result.error);
        return;
      }

      if (result.session) {
        // Success - user is now authenticated
        Alert.alert(
          'Login Successful', 
          `Welcome, ${result.session.user.name || result.session.user.email}!`
        );
        onSuccess?.(result.session);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Login Error', 'An unexpected error occurred. Please try again.');
      onError?.(error);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.googleButton, disabled && styles.disabled, style]}
      onPress={handleGoogleSignIn}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <View style={styles.googleIcon}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
          <Text style={styles.buttonText}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285f4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  disabled: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  googleIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4285f4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
