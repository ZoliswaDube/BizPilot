import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

export interface BiometricInfo {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  securityLevel: LocalAuthentication.SecurityLevel;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  warning?: string;
}

export class BiometricAuthService {
  private static instance: BiometricAuthService;

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  // Check biometric availability and enrollment
  async getBiometricInfo(): Promise<BiometricInfo> {
    try {
      const [isAvailable, isEnrolled, supportedTypes, securityLevel] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        LocalAuthentication.getEnrolledLevelAsync(),
      ]);

      return {
        isAvailable,
        isEnrolled,
        supportedTypes,
        securityLevel,
      };
    } catch (error) {
      console.error('Error getting biometric info:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
        securityLevel: LocalAuthentication.SecurityLevel.NONE,
      };
    }
  }

  // Authenticate with biometrics
  async authenticate(
    promptMessage: string = 'Verify your identity',
    cancelLabel: string = 'Cancel',
    fallbackLabel?: string
  ): Promise<BiometricAuthResult> {
    try {
      const info = await this.getBiometricInfo();

      if (!info.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      if (!info.isEnrolled) {
        return {
          success: false,
          error: 'No biometric credentials are enrolled on this device',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel,
        fallbackLabel,
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      }

      // Handle specific error cases
      switch (result.error) {
        case 'user_cancel':
          return { success: false, error: 'Authentication was cancelled' };
        case 'user_fallback':
          return { success: false, error: 'User chose to use fallback authentication' };
        case 'system_cancel':
          return { success: false, error: 'Authentication was cancelled by the system' };
        case 'passcode_not_set':
          return { success: false, error: 'Device passcode is not set' };
        case 'biometric_not_available':
          return { success: false, error: 'Biometric authentication is not available' };
        case 'biometric_not_enrolled':
          return { success: false, error: 'No biometric credentials are enrolled' };
        case 'biometric_locked_out':
          return { success: false, error: 'Biometric authentication is temporarily locked' };
        default:
          return { success: false, error: 'Authentication failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Biometric authentication error',
      };
    }
  }

  // Check if biometric authentication is configured for the app
  async isConfigured(): Promise<boolean> {
    try {
      const isEnabled = await SecureStore.getItemAsync('biometric_enabled');
      return isEnabled === 'true';
    } catch {
      return false;
    }
  }

  // Enable biometric authentication for the app
  async enable(): Promise<BiometricAuthResult> {
    try {
      const info = await this.getBiometricInfo();

      if (!info.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      if (!info.isEnrolled) {
        return {
          success: false,
          error: 'Please enroll biometric credentials in your device settings first',
        };
      }

      // Test biometric authentication
      const authResult = await this.authenticate(
        'Enable biometric authentication for BizPilot',
        'Cancel',
        'Use password instead'
      );

      if (!authResult.success) {
        return authResult;
      }

      // Store biometric enabled flag
      await SecureStore.setItemAsync('biometric_enabled', 'true');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enable biometric authentication',
      };
    }
  }

  // Disable biometric authentication for the app
  async disable(): Promise<BiometricAuthResult> {
    try {
      await SecureStore.deleteItemAsync('biometric_enabled');
      await SecureStore.deleteItemAsync('biometric_credentials');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disable biometric authentication',
      };
    }
  }

  // Get user-friendly description of available biometric types
  getBiometricTypesDescription(supportedTypes: LocalAuthentication.AuthenticationType[]): string {
    const types: string[] = [];

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      types.push('Fingerprint');
    }

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      types.push('Face ID');
    }

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      types.push('Iris scanning');
    }

    if (types.length === 0) {
      return 'Biometric authentication';
    }

    if (types.length === 1) {
      return types[0];
    }

    if (types.length === 2) {
      return `${types[0]} and ${types[1]}`;
    }

    return `${types.slice(0, -1).join(', ')}, and ${types[types.length - 1]}`;
  }

  // Show setup prompt if biometric is available but not configured
  async showSetupPromptIfAvailable(): Promise<void> {
    try {
      const info = await this.getBiometricInfo();
      const isConfigured = await this.isConfigured();

      if (info.isAvailable && info.isEnrolled && !isConfigured) {
        const biometricType = this.getBiometricTypesDescription(info.supportedTypes);

        Alert.alert(
          'Enable Biometric Authentication',
          `Would you like to enable ${biometricType} for faster sign-in?`,
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                const result = await this.enable();
                if (!result.success && result.error) {
                  Alert.alert('Setup Failed', result.error);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error showing biometric setup prompt:', error);
    }
  }

  // Validate biometric security level
  isSecureEnough(securityLevel: LocalAuthentication.SecurityLevel): boolean {
    return securityLevel >= LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK;
  }

  // Get security level description
  getSecurityLevelDescription(securityLevel: LocalAuthentication.SecurityLevel): string {
    switch (securityLevel) {
      case LocalAuthentication.SecurityLevel.NONE:
        return 'No security';
      case LocalAuthentication.SecurityLevel.SECRET:
        return 'Device credential (PIN, pattern, password)';
      case LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK:
        return 'Weak biometric authentication';
      case LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG:
        return 'Strong biometric authentication';
      default:
        return 'Unknown security level';
    }
  }
}

// Export singleton instance
export const biometricAuthService = BiometricAuthService.getInstance(); 