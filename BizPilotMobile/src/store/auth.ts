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
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setBusiness: (business: Business | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      business: null,
      token: null,
      isLoading: true,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Get stored token
          const token = await SecureStore.getItemAsync('auth_token');
          
          if (token) {
            // TODO: Validate token with MCP server
            // For now, we'll use the persisted user data
            const { user, business } = get();
            
            if (user) {
              set({ token, isLoading: false });
              return;
            }
          }
          
          set({ user: null, business: null, token: null, isLoading: false });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ 
            user: null, 
            business: null, 
            token: null, 
            isLoading: false, 
            error: 'Failed to initialize authentication' 
          });
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // TODO: Implement MCP server authentication
          // This is a placeholder implementation
          const mockUser: User = {
            id: 'user-123',
            email,
            full_name: 'Demo User',
            avatar_url: null,
          };
          
          const mockBusiness: Business = {
            id: 'business-123',
            name: 'Demo Business',
            description: 'A demo business for testing',
            address: null,
            phone: null,
            email: null,
            logo_url: null,
          };
          
          const token = 'demo-token-' + Date.now();
          
          // Store token securely
          await SecureStore.setItemAsync('auth_token', token);
          
          set({ 
            user: mockUser,
            business: mockBusiness,
            token,
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Sign in error:', error);
          set({ 
            isLoading: false, 
            error: 'Invalid email or password' 
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // TODO: Implement MCP server registration
          // This is a placeholder implementation
          const mockUser: User = {
            id: 'user-' + Date.now(),
            email,
            full_name: fullName,
            avatar_url: null,
          };
          
          const token = 'demo-token-' + Date.now();
          
          // Store token securely
          await SecureStore.setItemAsync('auth_token', token);
          
          set({ 
            user: mockUser,
            business: null, // User needs to create/join a business
            token,
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Sign up error:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to create account' 
          });
          throw error;
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Remove token from secure storage
          await SecureStore.deleteItemAsync('auth_token');
          
          set({ 
            user: null,
            business: null, 
            token: null, 
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Sign out error:', error);
          set({ isLoading: false });
        }
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      setBusiness: (business: Business | null) => {
        set({ business });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user and business data, not sensitive token
      partialize: (state) => ({ 
        user: state.user,
        business: state.business 
      }),
    }
  )
); 