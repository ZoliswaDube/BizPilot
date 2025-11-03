import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../config/api';

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
  refreshProfile: () => Promise<void>;
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
          
          // Try to get current user from stored token
          try {
            const currentUser = await apiClient.auth.getCurrentUser();
            if (currentUser) {
              // Get user's business information
              const businesses = await apiClient.business.getBusinesses();
              const activeBusiness = businesses.length > 0 ? businesses[0] : null;

              set({
                user: {
                  id: currentUser.id,
                  email: currentUser.email,
                  full_name: currentUser.profile?.full_name || null,
                  avatar_url: currentUser.profile?.avatar_url || null,
                },
                business: activeBusiness ? {
                  id: activeBusiness.id,
                  name: activeBusiness.name,
                  description: activeBusiness.description,
                  address: activeBusiness.address,
                  phone: activeBusiness.phone,
                  email: activeBusiness.email,
                  logo_url: activeBusiness.logo_url,
                } : null,
                token: currentUser.id, // We'll store user ID as token reference
                isLoading: false,
                loading: false,
                error: null,
              });
            } else {
              set({ isLoading: false, loading: false });
            }
          } catch (error) {
            // No valid session found
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
          
          // Sign in with custom backend
          const response = await apiClient.auth.login({ email, password });

          if (!response.user) {
            throw new Error('Authentication failed');
          }

          // Get user's business information
          const businesses = await apiClient.business.getBusinesses();
          const activeBusiness = businesses.length > 0 ? businesses[0] : null;

          set({
            user: {
              id: response.user.id,
              email: response.user.email,
              full_name: response.user.profile?.full_name || null,
              avatar_url: response.user.profile?.avatar_url || null,
            },
            business: activeBusiness ? {
              id: activeBusiness.id,
              name: activeBusiness.name,
              description: activeBusiness.description,
              address: activeBusiness.address,
              phone: activeBusiness.phone,
              email: activeBusiness.email,
              logo_url: activeBusiness.logo_url,
            } : null,
            token: response.tokens.accessToken,
            loading: false,
            error: null,
          });
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
          
          // Sign up with custom backend
          const response = await apiClient.auth.register({ 
            email, 
            password, 
            fullName 
          });

          if (!response.user) {
            throw new Error('Account creation failed');
          }

          set({
            user: {
              id: response.user.id,
              email: response.user.email,
              full_name: response.user.profile?.full_name || null,
              avatar_url: response.user.profile?.avatar_url || null,
            },
            business: null, // User will need to create/join a business
            token: response.tokens.accessToken,
            loading: false,
            error: null,
          });
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
          // Sign out with custom backend
          await apiClient.auth.logout();
          
          set({
            user: null,
            business: null,
            token: null,
            error: null,
          });
        } catch (error: any) {
          console.error('Sign out error:', error);
          // Still clear local state even if sign out fails
          set({
            user: null,
            business: null,
            token: null,
            error: null,
          });
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        try {
          set({ loading: true, error: null });
          
          const { user } = get();
          if (!user) throw new Error('Not authenticated');

          // Update user profile via custom backend
          const updatedUser = await apiClient.user.updateProfile({
            full_name: updates.full_name,
            avatar_url: updates.avatar_url,
          });

          set({
            user: { ...user, ...updates },
            loading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Profile update error:', error);
          set({ 
            error: error.message, 
            loading: false 
          });
          throw error;
        }
      },

      refreshProfile: async () => {
        try {
          const { user } = get();
          if (!user) return;

          // Get updated user and business information from custom backend
          const [currentUser, businesses] = await Promise.all([
            apiClient.auth.getCurrentUser(),
            apiClient.business.getBusinesses()
          ]);

          if (!currentUser) return;

          const activeBusiness = businesses.length > 0 ? businesses[0] : null;

          set({
            user: {
              id: currentUser.id,
              email: currentUser.email,
              full_name: currentUser.profile?.full_name || null,
              avatar_url: currentUser.profile?.avatar_url || null,
            },
            business: activeBusiness ? {
              id: activeBusiness.id,
              name: activeBusiness.name,
              description: activeBusiness.description,
              address: activeBusiness.address,
              phone: activeBusiness.phone,
              email: activeBusiness.email,
              logo_url: activeBusiness.logo_url,
            } : null,
            error: null,
          });
        } catch (error: any) {
          console.error('Profile refresh error:', error);
          set({ error: error.message });
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

 