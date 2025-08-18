import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { supabase, MobileSessionManager } from '../lib/supabase';
import { demoAuth } from '../lib/demoAuth';

// Check if we're in demo mode
const isDemoMode = !process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
          
          // Initialize mobile session manager (only for real Supabase)
          if (!isDemoMode) {
            MobileSessionManager.initialize();
          }
          
          // Get current session from Supabase or demo auth
          const { data: { session }, error } = isDemoMode 
            ? await demoAuth.getSession()
            : await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            set({ isLoading: false, loading: false, error: error.message });
            return;
          }

          if (!session) {
            set({ isLoading: false, loading: false });
            return;
          }

          let user: User;
          let business: Business | null = null;

          if (isDemoMode) {
            // Use demo auth data
            const userProfile = demoAuth.getUserProfile(session.user.id);
            const businessData = demoAuth.getBusinessForUser(session.user.id);
            
            user = userProfile.data || {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.full_name || null,
              avatar_url: null,
            };
            business = businessData.data;
          } else {
            // Get user profile and business information from Supabase
            const [userProfile, businessData] = await Promise.all([
              supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single(),
              supabase
                .from('business_users')
                .select(`
                  business_id,
                  role,
                  is_active,
                  businesses (
                    id,
                    name,
                    description,
                    address,
                    phone,
                    email,
                    logo_url
                  )
                `)
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .single()
            ]);

            user = userProfile.data ? {
              id: userProfile.data.user_id,
              email: userProfile.data.email,
              full_name: userProfile.data.full_name,
              avatar_url: userProfile.data.avatar_url,
            } : {
              id: session.user.id,
              email: session.user.email || '',
              full_name: (session.user as any).user_metadata?.full_name || null,
              avatar_url: null,
            };

            business = businessData.data?.businesses ? {
              id: businessData.data.businesses.id,
              name: businessData.data.businesses.name,
              description: businessData.data.businesses.description,
              address: businessData.data.businesses.address,
              phone: businessData.data.businesses.phone,
              email: businessData.data.businesses.email,
              logo_url: businessData.data.businesses.logo_url,
            } : null;
          }

          set({
            user,
            business,
            token: session.access_token,
            isLoading: false,
            loading: false,
            error: null,
          });
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
          
          // Sign in with Supabase or demo auth
          const { data, error } = isDemoMode 
            ? await demoAuth.signInWithPassword(email, password)
            : await supabase.auth.signInWithPassword({ email, password });

          if (error) {
            throw new Error(error.message || 'Authentication failed');
          }

          if (!data.session || !data.user) {
            throw new Error('No session returned from authentication');
          }

          let user: User;
          let business: Business | null = null;

          if (isDemoMode) {
            // Use demo auth data
            const userProfile = demoAuth.getUserProfile(data.user.id);
            const businessData = demoAuth.getBusinessForUser(data.user.id);
            
            user = userProfile.data || {
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.full_name || null,
              avatar_url: null,
            };
            business = businessData.data;
          } else {
            // Get user profile and business information from Supabase
            const [userProfile, businessData] = await Promise.all([
              supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', data.user.id)
                .single(),
              supabase
                .from('business_users')
                .select(`
                  business_id,
                  role,
                  is_active,
                  businesses (
                    id,
                    name,
                    description,
                    address,
                    phone,
                    email,
                    logo_url
                  )
                `)
                .eq('user_id', data.user.id)
                .eq('is_active', true)
                .single()
            ]);

            user = userProfile.data ? {
              id: userProfile.data.user_id,
              email: userProfile.data.email,
              full_name: userProfile.data.full_name,
              avatar_url: userProfile.data.avatar_url,
            } : {
              id: data.user.id,
              email: data.user.email || '',
              full_name: (data.user as any).user_metadata?.full_name || null,
              avatar_url: null,
            };

            business = businessData.data?.businesses ? {
              id: businessData.data.businesses.id,
              name: businessData.data.businesses.name,
              description: businessData.data.businesses.description,
              address: businessData.data.businesses.address,
              phone: businessData.data.businesses.phone,
              email: businessData.data.businesses.email,
              logo_url: businessData.data.businesses.logo_url,
            } : null;
          }

          set({
            user,
            business,
            token: data.session.access_token,
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
          
          // Sign up with Supabase or demo auth
          const { data, error } = isDemoMode 
            ? await demoAuth.signUp(email, password, fullName)
            : await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: {
                    full_name: fullName,
                  },
                },
              });

          if (error) {
            throw new Error(error.message || 'Account creation failed');
          }

          if (!data.user) {
            throw new Error('No user returned from registration');
          }

          // If user is confirmed (email verification not required), get session
          if (data.session) {
            let user: User;
            let business: Business | null = null;

            if (isDemoMode) {
              // Use demo auth data
              const userProfile = demoAuth.getUserProfile(data.user.id);
              const businessData = demoAuth.getBusinessForUser(data.user.id);
              
              user = userProfile.data || {
                id: data.user.id,
                email: data.user.email || email,
                full_name: fullName || null,
                avatar_url: null,
              };
              business = businessData.data;
            } else {
              // Create user profile in Supabase
              const profileData = {
                user_id: data.user.id,
                email: data.user.email || email,
                full_name: fullName || null,
                provider: 'email',
                email_verified: (data.user as any).email_confirmed_at ? true : false,
              };

              await supabase
                .from('user_profiles')
                .upsert(profileData, { onConflict: 'user_id' });

              user = {
                id: data.user.id,
                email: data.user.email || email,
                full_name: fullName || null,
                avatar_url: null,
              };
            }

            set({
              user,
              business, // Demo mode has a business, real mode doesn't initially
              token: data.session.access_token,
              loading: false,
              error: null,
            });
          } else {
            // Email verification required
            set({
              user: null,
              business: null,
              token: null,
              loading: false,
              error: 'Please check your email to verify your account.',
            });
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
          // Sign out with Supabase or demo auth
          if (isDemoMode) {
            await demoAuth.signOut();
          } else {
            await supabase.auth.signOut();
          }
          
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

          // Update user profile in Supabase
          const { error } = await supabase
            .from('user_profiles')
            .update({
              full_name: updates.full_name,
              avatar_url: updates.avatar_url,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
          
          if (error) {
            throw new Error(error.message || 'Profile update failed');
          }

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

          // Get updated session
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          // Get updated user profile and business information
          const [userProfile, businessData] = await Promise.all([
            supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single(),
            supabase
              .from('business_users')
              .select(`
                business_id,
                role,
                is_active,
                businesses (
                  id,
                  name,
                  description,
                  address,
                  phone,
                  email,
                  logo_url
                )
              `)
              .eq('user_id', session.user.id)
              .eq('is_active', true)
              .single()
          ]);

          const updatedUser = userProfile.data ? {
            id: userProfile.data.user_id,
            email: userProfile.data.email,
            full_name: userProfile.data.full_name,
            avatar_url: userProfile.data.avatar_url,
          } : {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || null,
            avatar_url: null,
          };

          const updatedBusiness = businessData.data?.businesses ? {
            id: businessData.data.businesses.id,
            name: businessData.data.businesses.name,
            description: businessData.data.businesses.description,
            address: businessData.data.businesses.address,
            phone: businessData.data.businesses.phone,
            email: businessData.data.businesses.email,
            logo_url: businessData.data.businesses.logo_url,
          } : null;

          set({
            user: updatedUser,
            business: updatedBusiness,
            token: session.access_token,
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

 