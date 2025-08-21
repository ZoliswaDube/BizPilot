import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Require real Supabase environment variables - no demo mode
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  throw new Error('Missing required Supabase environment variables. Please configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Custom storage implementation for React Native
const customStorage = {
  getItem: async (key: string) => {
    try {
      // Use SecureStore for sensitive data on native platforms
      if (Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(key);
      }
      // Fallback to AsyncStorage for web
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use custom storage for React Native
    storage: customStorage,
    // Automatically refresh tokens
    autoRefreshToken: true,
    // Persist session across app restarts
    persistSession: true,
    // Don't detect session in URL for mobile
    detectSessionInUrl: false,
    // Use PKCE flow for security
    flowType: 'pkce',
    // Custom storage key
    storageKey: 'bizpilot-mobile-auth',
  },
  global: {
    headers: {
      'x-application-name': 'BizPilot-Mobile',
    },
  },
  db: {
    schema: 'public',
  },
});

// Mobile-specific session manager
export class MobileSessionManager {
  private static refreshPromise: Promise<any> | null = null;
  private static isRefreshing = false;

  /**
   * Initialize session management
   */
  static initialize() {
    console.log('📱 MobileSessionManager: Initializing mobile session management');
    
    // Set up periodic session validation (every 10 minutes)
    setInterval(async () => {
      const session = await supabase.auth.getSession();
      if (session.data.session) {
        await this.validateAndRefreshSession();
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    console.log('📱 MobileSessionManager: Mobile session management initialized');
  }

  /**
   * Validate current session and refresh if needed
   */
  static async validateAndRefreshSession(): Promise<boolean> {
    try {
      console.log('📱 MobileSessionManager: Validating session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('📱 MobileSessionManager: Error getting session:', error);
        return false;
      }
      
      if (!session) {
        console.log('📱 MobileSessionManager: No session found');
        return false;
      }
      
      // Check if token is close to expiring (within 10 minutes)
      const expiresAt = session.expires_at;
      if (!expiresAt) {
        console.warn('📱 MobileSessionManager: Session has no expiration time');
        return true;
      }
      
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      console.log('📱 MobileSessionManager: Session status', {
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        timeUntilExpiry: `${Math.floor(timeUntilExpiry / 60)} minutes`,
        needsRefresh: timeUntilExpiry < 600
      });
      
      if (timeUntilExpiry < 600) { // Less than 10 minutes
        console.log('📱 MobileSessionManager: Token expires soon, refreshing...');
        return await this.refreshSession();
      }
      
      return true;
    } catch (error) {
      console.error('📱 MobileSessionManager: Error validating session:', error);
      return false;
    }
  }

  /**
   * Refresh the current session
   */
  static async refreshSession(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      console.log('📱 MobileSessionManager: Refresh already in progress, waiting...');
      if (this.refreshPromise) {
        return await this.refreshPromise;
      }
      return false;
    }
    
    this.isRefreshing = true;
    
    this.refreshPromise = (async () => {
      try {
        console.log('📱 MobileSessionManager: Refreshing session...');
        
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('📱 MobileSessionManager: Error refreshing session:', error);
          // If refresh fails, the user needs to re-authenticate
          await supabase.auth.signOut();
          return false;
        }
        
        if (data.session) {
          console.log('📱 MobileSessionManager: Session refreshed successfully');
          return true;
        }
        
        console.warn('📱 MobileSessionManager: No session returned from refresh');
        return false;
      } catch (error) {
        console.error('📱 MobileSessionManager: Unexpected error during refresh:', error);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();
    
    return await this.refreshPromise;
  }
}

// Helper function to handle Supabase requests with automatic retry
export async function supabaseRequest<T>(
  requestFn: () => Promise<T>,
  retryCount = 1
): Promise<T> {
  try {
    const result = await requestFn();
    return result;
  } catch (error: any) {
    console.log('📱 supabaseRequest: Request failed', { error: error?.message, retryCount });
    
    // Check if it's an auth error
    if (error?.message?.includes('JWT') || 
        error?.message?.includes('expired') || 
        error?.message?.includes('invalid') ||
        error?.code === 'PGRST301') {
      
      if (retryCount > 0) {
        console.log('📱 supabaseRequest: Auth error detected, attempting session refresh');
        
        const refreshed = await MobileSessionManager.refreshSession();
        if (refreshed) {
          console.log('📱 supabaseRequest: Session refreshed, retrying request');
          return await supabaseRequest(requestFn, retryCount - 1);
        } else {
          console.error('📱 supabaseRequest: Failed to refresh session');
          throw new Error('Session expired. Please sign in again.');
        }
      }
    }
    
    throw error;
  }
}

// Database types (subset for mobile)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          provider: string;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          provider?: string;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          provider?: string;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      businesses: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_users: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: string;
          is_active: boolean | null;
          invited_at: string | null;
          accepted_at: string | null;
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role?: string;
          is_active?: boolean | null;
          invited_at?: string | null;
          accepted_at?: string | null;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          role?: string;
          is_active?: boolean | null;
          invited_at?: string | null;
          accepted_at?: string | null;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other tables as needed
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
