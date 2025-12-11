import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Enhanced Supabase client configuration with automatic token refresh
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Automatically refresh tokens when they're about to expire
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Storage configuration
    storage: window.localStorage,
    // Set custom storage key
    storageKey: 'bizpilot-auth-token',
    // Detect sessions in other tabs and sync
    detectSessionInUrl: true,
    // Advanced auth settings
    flowType: 'pkce',
    // Custom debug logging for auth
    debug: false,
  },
  // Global request settings
  global: {
    headers: {
      'x-application-name': 'BizPilot',
    },
  },
  // Database settings
  db: {
    schema: 'public',
  },
  // Realtime settings
  realtime: {
    params: {
      eventsPerSecond: 2, // Reduce realtime event frequency to prevent overload
    },
  },
})

// Session validation and refresh utilities
export class SessionManager {
  private static refreshPromise: Promise<any> | null = null
  private static isRefreshing = false
  private static lastActivity = Date.now()
  private static activityTimer: NodeJS.Timeout | null = null
  
  /**
   * Initialize session management with activity tracking
   */
  static initialize() {
    console.log('🔐 SessionManager: Initializing session management')
    
    // Track user activity
    this.setupActivityTracking()
    
    // Set up periodic session validation
    this.setupPeriodicValidation()
    
    // Set up visibility change handling
    this.setupVisibilityHandler()
    
    console.log('🔐 SessionManager: Session management initialized')
  }
  
  /**
   * Track user activity to detect when user returns
   */
  private static setupActivityTracking() {
    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const updateActivity = () => {
      this.lastActivity = Date.now()
    }
    
    activities.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })
  }
  
  /**
   * Set up periodic session validation (every 5 minutes)
   */
  private static setupPeriodicValidation() {
    setInterval(async () => {
      const session = await supabase.auth.getSession()
      if (session.data.session) {
        await this.validateAndRefreshSession()
      }
    }, 5 * 60 * 1000) // 5 minutes
  }
  
  /**
   * Handle page visibility changes (when user switches tabs)
   */
  private static setupVisibilityHandler() {
    let lastValidation = 0
    const MIN_VALIDATION_INTERVAL = 60000 // 1 minute minimum between validations
    
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        const now = Date.now()
        const timeSinceLastValidation = now - lastValidation
        
        // Only validate if it's been more than 1 minute since last validation
        if (timeSinceLastValidation > MIN_VALIDATION_INTERVAL) {
          console.log('🔐 SessionManager: User returned to tab, checking session')
          lastValidation = now
          
          // Don't await - let it happen in background to avoid blocking UI
          this.validateAndRefreshSession().catch(error => {
            console.error('🔐 SessionManager: Background validation failed:', error)
          })
        } else {
          console.log('🔐 SessionManager: Skipping validation, too soon since last check')
        }
      }
    })
  }
  
  /**
   * Validate current session and refresh if needed
   */
  static async validateAndRefreshSession(): Promise<boolean> {
    try {
      console.log('🔐 SessionManager: Validating session...')
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('🔐 SessionManager: Error getting session:', error)
        return false
      }
      
      if (!session) {
        console.log('🔐 SessionManager: No session found')
        return false
      }
      
             // Check if token is close to expiring (within 5 minutes)
       const expiresAt = session.expires_at
       if (!expiresAt) {
         console.warn('🔐 SessionManager: Session has no expiration time')
         return true // Assume valid if no expiration
       }
       
       const now = Math.floor(Date.now() / 1000)
       const timeUntilExpiry = expiresAt - now
       
       console.log('🔐 SessionManager: Session status', {
         expiresAt: new Date(expiresAt * 1000).toISOString(),
         timeUntilExpiry: `${Math.floor(timeUntilExpiry / 60)} minutes`,
         needsRefresh: timeUntilExpiry < 300
       })
      
      if (timeUntilExpiry < 300) { // Less than 5 minutes
        console.log('🔐 SessionManager: Token expires soon, refreshing...')
        return await this.refreshSession()
      }
      
      return true
    } catch (error) {
      console.error('🔐 SessionManager: Error validating session:', error)
      return false
    }
  }
  
  /**
   * Refresh the current session
   */
  static async refreshSession(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      console.log('🔐 SessionManager: Refresh already in progress, waiting...')
      if (this.refreshPromise) {
        return await this.refreshPromise
      }
      return false
    }
    
    this.isRefreshing = true
    
    this.refreshPromise = (async () => {
      try {
        console.log('🔐 SessionManager: Refreshing session...')
        
        const { data, error } = await supabase.auth.refreshSession()
        
        if (error) {
          console.error('🔐 SessionManager: Error refreshing session:', error)
          // If refresh fails, the user needs to re-authenticate
          await supabase.auth.signOut()
          return false
        }
        
        if (data.session) {
          console.log('🔐 SessionManager: Session refreshed successfully')
          return true
        }
        
        console.warn('🔐 SessionManager: No session returned from refresh')
        return false
      } catch (error) {
        console.error('🔐 SessionManager: Unexpected error during refresh:', error)
        return false
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()
    
    return await this.refreshPromise
  }
  
  /**
   * Check if user has been inactive for a long time
   */
  static isInactive(): boolean {
    const inactiveThreshold = 30 * 60 * 1000 // 30 minutes
    return Date.now() - this.lastActivity > inactiveThreshold
  }
  
  /**
   * Force session validation (useful when user performs an action after inactivity)
   */
  static async forceValidation(): Promise<boolean> {
    console.log('🔐 SessionManager: Force validation requested')
    return await this.validateAndRefreshSession()
  }
}

// Enhanced request wrapper with automatic retry on auth errors
export async function supabaseRequest<T>(
  requestFn: () => Promise<T>,
  retryCount = 1
): Promise<T> {
  try {
    const result = await requestFn()
    return result
  } catch (error: any) {
    console.log('🔐 supabaseRequest: Request failed', { error: error?.message, retryCount })
    
    // Check if it's an auth error
    if (error?.message?.includes('JWT') || 
        error?.message?.includes('expired') || 
        error?.message?.includes('invalid') ||
        error?.code === 'PGRST301') {
      
      if (retryCount > 0) {
        console.log('🔐 supabaseRequest: Auth error detected, attempting session refresh')
        
        const refreshed = await SessionManager.refreshSession()
        if (refreshed) {
          console.log('🔐 supabaseRequest: Session refreshed, retrying request')
          return await supabaseRequest(requestFn, retryCount - 1)
        } else {
          console.error('🔐 supabaseRequest: Failed to refresh session')
          throw new Error('Session expired. Please sign in again.')
        }
      }
    }
    
    throw error
  }
}

// Helper function to handle common Supabase operations with retry
export async function supabaseQuery<T>(
  tableName: string,
  queryFn: (table: any) => any,
  options: { retryOnAuth?: boolean } = {}
) {
  const { retryOnAuth = true } = options
  
  const execute = async () => {
    const query = queryFn(supabase.from(tableName))
    const { data, error } = await query
    
    if (error) {
      throw error
    }
    
    return data as T
  }
  
  if (retryOnAuth) {
    return await supabaseRequest(execute)
  } else {
    return await execute()
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_user: boolean
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_user: boolean
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_user?: boolean
        }
      }
      business_users: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          role?: string
          updated_at?: string
          user_id?: string
        }
      }
      businesses: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
      }
      categories: {
        Row: {
          attributes: Json | null
          business_id: string | null
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          attributes?: Json | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          attributes?: Json | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
        }
      }
      ingredients: {
        Row: {
          cost: number
          id: string
          name: string
          product_id: string | null
          quantity: number
          unit: string
        }
        Insert: {
          cost?: number
          id?: string
          name: string
          product_id?: string | null
          quantity?: number
          unit?: string
        }
        Update: {
          cost?: number
          id?: string
          name?: string
          product_id?: string | null
          quantity?: number
          unit?: string
        }
      }
      inventory: {
        Row: {
          batch_lot_number: string | null
          business_id: string | null
          cost_per_unit: number
          current_quantity: number
          expiration_date: string | null
          id: string
          low_stock_alert: number | null
          name: string
          product_id: string | null
          unit: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          batch_lot_number?: string | null
          business_id?: string | null
          cost_per_unit?: number
          current_quantity?: number
          expiration_date?: string | null
          id?: string
          low_stock_alert?: number | null
          name: string
          product_id?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          batch_lot_number?: string | null
          business_id?: string | null
          cost_per_unit?: number
          current_quantity?: number
          expiration_date?: string | null
          id?: string
          low_stock_alert?: number | null
          name?: string
          product_id?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string | null
        }
      }
      inventory_transactions: {
        Row: {
          business_id: string | null
          id: string
          inventory_id: string
          new_quantity: number
          notes: string | null
          quantity_change: number
          transaction_date: string
          type: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          id?: string
          inventory_id: string
          new_quantity: number
          notes?: string | null
          quantity_change: number
          transaction_date?: string
          type: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          id?: string
          inventory_id?: string
          new_quantity?: number
          notes?: string | null
          quantity_change?: number
          transaction_date?: string
          type?: string
          user_id?: string | null
        }
      }
      products: {
        Row: {
          barcode: string | null
          business_id: string | null
          category_id: string | null
          created_at: string | null
          id: string
          image_url: string | null
          labor_minutes: number | null
          location: string | null
          min_stock_level: number | null
          name: string
          profit_margin: number | null
          reorder_point: number | null
          selling_price: number | null
          sku: string | null
          supplier_id: string | null
          total_cost: number | null
          user_id: string | null
        }
        Insert: {
          barcode?: string | null
          business_id?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          labor_minutes?: number | null
          location?: string | null
          min_stock_level?: number | null
          name: string
          profit_margin?: number | null
          reorder_point?: number | null
          selling_price?: number | null
          sku?: string | null
          supplier_id?: string | null
          total_cost?: number | null
          user_id?: string | null
        }
        Update: {
          barcode?: string | null
          business_id?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          labor_minutes?: number | null
          location?: string | null
          min_stock_level?: number | null
          name?: string
          profit_margin?: number | null
          reorder_point?: number | null
          selling_price?: number | null
          sku?: string | null
          supplier_id?: string | null
          total_cost?: number | null
          user_id?: string | null
        }
      }
      qr_codes: {
        Row: {
          business_id: string | null
          business_name: string | null
          created_at: string
          custom_message: string | null
          id: string
          name: string
          page_url: string | null
          qr_data_url: string | null
          tip_amounts: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          business_name?: string | null
          created_at?: string
          custom_message?: string | null
          id?: string
          name: string
          page_url?: string | null
          qr_data_url?: string | null
          tip_amounts: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          business_name?: string | null
          created_at?: string
          custom_message?: string | null
          id?: string
          name?: string
          page_url?: string | null
          qr_data_url?: string | null
          tip_amounts?: Json
          updated_at?: string
          user_id?: string
        }
      }
      suppliers: {
        Row: {
          address: string | null
          business_id: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          business_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          business_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
      }
      user_permissions: {
        Row: {
          action: string
          created_at: string
          id: string
          resource: string
          role_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          resource: string
          role_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          resource?: string
          role_id?: string
        }
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          business_id: string | null
          created_at: string
          email: string
          email_verified: boolean
          full_name: string | null
          id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string
          email: string
          email_verified?: boolean
          full_name?: string | null
          id?: string
          provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          full_name?: string | null
          id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
      }
      user_roles: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          business_id: string | null
          business_name: string | null
          default_margin: number | null
          hourly_rate: number | null
          id: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          business_name?: string | null
          default_margin?: number | null
          hourly_rate?: number | null
          id?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          business_name?: string | null
          default_margin?: number | null
          hourly_rate?: number | null
          id?: string
          user_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_sample_data_for_user: {
        Args: { user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export function getURL() {
  // Priority order:
  // 1. VITE_SITE_URL from .env (explicit configuration)
  // 2. VITE_VERCEL_URL from Vercel deployment
  // 3. window.location.origin (current domain - works for any deployment)
  // 4. localhost fallback (development only)
  let url = import.meta.env.VITE_SITE_URL ?? 
    import.meta.env.VITE_VERCEL_URL ?? 
    ((typeof window !== 'undefined' ? window.location.origin : '') ||
    'http://localhost:5173/')
  
  console.log('🌐 getURL() called', { 
    url, 
    VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
    VITE_VERCEL_URL: import.meta.env.VITE_VERCEL_URL,
    windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A'
  })
  
  // Make sure to include `https://` when not localhost
  url = url.includes('http') ? url : `https://${url}`
  // Make sure to include trailing `/`
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  
  console.log('🌐 getURL() final URL:', url)
  console.log('⚠️ IMPORTANT: Ensure this URL is added to Supabase Auth -> URL Configuration -> Redirect URLs')
  console.log('   Add both:', `${url}auth/callback`, 'and', `${url}**`)
  
  return url
}