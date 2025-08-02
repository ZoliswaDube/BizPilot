import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Business {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

interface AuthState {
  user: User | null;
  business: Business | null;
  token: string | null;
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  selectBusiness: (business: Business) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      business: null,
      token: null,
      isLoading: false,
      loading: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true, loading: true });
          
          // Try to get stored token
          const token = await SecureStore.getItemAsync('auth_token');
          if (!token) {
            set({ isLoading: false, loading: false });
            return;
          }

          // Mock API call - replace with actual MCP server integration
          const response = await mockAuthAPI('GET', '/user', token);
          if (response.success) {
            set({
              user: response.user,
              business: response.business,
              token,
              isLoading: false,
              loading: false,
              error: null,
            });
          } else {
            await SecureStore.deleteItemAsync('auth_token');
            set({ isLoading: false, loading: false });
          }
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({ 
            error: error.message, 
            isLoading: false, 
            loading: false 
          });
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          // Mock API call - replace with actual MCP server integration
          const response = await mockAuthAPI('POST', '/auth/signin', null, {
            email,
            password,
          });

          if (response.success) {
            await SecureStore.setItemAsync('auth_token', response.token);
            set({
              user: response.user,
              business: response.business,
              token: response.token,
              loading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Authentication failed');
          }
        } catch (error: any) {
          console.error('Sign in error:', error);
          set({ 
            error: error.message, 
            loading: false 
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, fullName?: string) => {
        try {
          set({ loading: true, error: null });
          
          // Mock API call - replace with actual MCP server integration
          const response = await mockAuthAPI('POST', '/auth/signup', null, {
            email,
            password,
            full_name: fullName,
          });

          if (response.success) {
            await SecureStore.setItemAsync('auth_token', response.token);
            set({
              user: response.user,
              business: response.business,
              token: response.token,
              loading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Account creation failed');
          }
        } catch (error: any) {
          console.error('Sign up error:', error);
          set({ 
            error: error.message, 
            loading: false 
          });
          throw error;
        }
      },

      signOut: async () => {
        try {
          await SecureStore.deleteItemAsync('auth_token');
          set({
            user: null,
            business: null,
            token: null,
            error: null,
          });
        } catch (error: any) {
          console.error('Sign out error:', error);
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        try {
          set({ loading: true, error: null });
          
          const { user, token } = get();
          if (!user || !token) throw new Error('Not authenticated');

          // Mock API call - replace with actual MCP server integration
          const response = await mockAuthAPI('PATCH', '/user/profile', token, updates);
          
          if (response.success) {
            set({
              user: { ...user, ...updates },
              loading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Profile update failed');
          }
        } catch (error: any) {
          console.error('Profile update error:', error);
          set({ 
            error: error.message, 
            loading: false 
          });
          throw error;
        }
      },

      selectBusiness: (business: Business) => {
        set({ business });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        business: state.business,
      }),
    }
  )
);

// Mock API function - replace with actual MCP server integration
async function mockAuthAPI(
  method: string,
  endpoint: string,
  token?: string | null,
  data?: any
): Promise<any> {
  console.log(`Mock API: ${method} ${endpoint}`, data);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock successful responses
  if (endpoint === '/auth/signin' || endpoint === '/auth/signup') {
    return {
      success: true,
      token: 'mock_token_' + Date.now(),
      user: {
        id: 'user_1',
        email: data.email,
        full_name: data.full_name || 'Test User',
        avatar_url: null,
      },
      business: {
        id: 'business_1',
        name: 'Test Business',
        description: 'A test business',
        address: null,
        phone: null,
        email: null,
        logo_url: null,
      },
    };
  }
  
  if (endpoint === '/user' && token) {
    return {
      success: true,
      user: {
        id: 'user_1',
        email: 'test@example.com',
        full_name: 'Test User',
        avatar_url: null,
      },
      business: {
        id: 'business_1',
        name: 'Test Business',
        description: 'A test business',
        address: null,
        phone: null,
        email: null,
        logo_url: null,
      },
    };
  }
  
  return { success: false, message: 'API endpoint not implemented' };
} 