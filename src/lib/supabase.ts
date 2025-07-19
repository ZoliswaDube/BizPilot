import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  let url = import.meta.env.VITE_SITE_URL ?? 
    import.meta.env.VITE_VERCEL_URL ?? 
    'http://localhost:5173/'
  
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  // Make sure to include trailing (/) when not localhost.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  
  return url
}