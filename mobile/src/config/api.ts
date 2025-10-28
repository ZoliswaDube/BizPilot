import { createApiClient, BizPilotApiClient } from '../../../shared/src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1'  // Development
  : 'https://your-backend-domain.onrender.com/api/v1'; // Production

// Token storage keys
const ACCESS_TOKEN_KEY = 'bizpilot_access_token';
const REFRESH_TOKEN_KEY = 'bizpilot_refresh_token';

// Token management functions
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
      ]);
    } catch (error) {
      console.error('Error setting tokens:', error);
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
};

// Create the API client instance
export const apiClient: BizPilotApiClient = createApiClient({
  baseURL: API_BASE_URL,
  getAccessToken: tokenStorage.getAccessToken,
  getRefreshToken: tokenStorage.getRefreshToken,
  onTokenRefresh: ({ accessToken, refreshToken }) => {
    tokenStorage.setTokens(accessToken, refreshToken);
  },
  onAuthError: () => {
    // Handle auth errors (e.g., logout user)
    tokenStorage.clearTokens();
    // You might want to navigate to login screen here
    console.log('Authentication error - redirecting to login');
  },
});

export default apiClient;



