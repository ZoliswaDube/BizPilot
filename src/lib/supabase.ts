import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Auth configuration for OAuth providers
export const getURL = () => {
  let url =
    import.meta.env.VITE_SITE_URL ?? // Set this to your site URL in production env.
    import.meta.env.VITE_VERCEL_URL ?? // Automatically set by Vercel.
    'https://profitpilotpro.net' // Production URL as fallback
  
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  
  // Make sure to include trailing `/` only if it's not already there.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  
  console.log('🔗 getURL(): Generated URL:', url)
  return url
}

// Database types
export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          total_cost: number
          labor_minutes: number
          selling_price: number
          profit_margin: number
          created_at: string
          sku: string | null
          min_stock_level: number | null
          reorder_point: number | null
          location: string | null
          supplier_id: string | null
          image_url: string | null
          barcode: string | null
          category_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          total_cost?: number
          labor_minutes?: number
          selling_price?: number
          profit_margin?: number
          created_at?: string
          sku?: string | null
          min_stock_level?: number | null
          reorder_point?: number | null
          location?: string | null
          supplier_id?: string | null
          image_url?: string | null
          barcode?: string | null
          category_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          total_cost?: number
          labor_minutes?: number
          selling_price?: number
          profit_margin?: number
          created_at?: string
          sku?: string | null
          min_stock_level?: number | null
          reorder_point?: number | null
          location?: string | null
          supplier_id?: string | null
          image_url?: string | null
          barcode?: string | null
          category_id?: string | null
        }
      }
      ingredients: {
        Row: {
          id: string
          product_id: string
          name: string
          cost: number
          quantity: number
          unit: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          cost: number
          quantity: number
          unit: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          cost?: number
          quantity?: number
          unit?: string
        }
      }
      inventory: {
        Row: {
          id: string
          user_id: string
          name: string
          current_quantity: number
          unit: string
          low_stock_alert: number
          cost_per_unit: number
          updated_at: string
          product_id: string | null
          batch_lot_number: string | null
          expiration_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          current_quantity: number
          unit: string
          low_stock_alert?: number
          cost_per_unit: number
          updated_at?: string
          product_id?: string | null
          batch_lot_number?: string | null
          expiration_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          current_quantity?: number
          unit?: string
          low_stock_alert?: number
          cost_per_unit?: number
          updated_at?: string
          product_id?: string | null
          batch_lot_number?: string | null
          expiration_date?: string | null
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          business_name: string | null
          hourly_rate: number
          default_margin: number
        }
        Insert: {
          id?: string
          user_id: string
          business_name?: string | null
          hourly_rate?: number
          default_margin?: number
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string | null
          hourly_rate?: number
          default_margin?: number
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          parent_id: string | null
          attributes: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          parent_id?: string | null
          attributes?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          parent_id?: string | null
          attributes?: Record<string, any> | null
          created_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          user_id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          user_id: string
          inventory_id: string
          type: string
          quantity_change: number
          new_quantity: number
          transaction_date: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          inventory_id: string
          type: string
          quantity_change: number
          new_quantity: number
          transaction_date?: string
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          inventory_id?: string
          type?: string
          quantity_change?: number
          new_quantity?: number
          transaction_date?: string
          notes?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          provider: string
          email_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          provider?: string
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          provider?: string
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          content: string
          is_user: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          content: string
          is_user: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          content?: string
          is_user?: boolean
          created_at?: string
        }
      }
      qr_codes: {
        Row: {
          id: string
          user_id: string
          name: string
          business_name: string | null
          tip_amounts: number[]
          custom_message: string | null
          qr_data_url: string | null
          page_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          business_name?: string | null
          tip_amounts: number[]
          custom_message?: string | null
          qr_data_url?: string | null
          page_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          business_name?: string | null
          tip_amounts?: number[]
          custom_message?: string | null
          qr_data_url?: string | null
          page_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}