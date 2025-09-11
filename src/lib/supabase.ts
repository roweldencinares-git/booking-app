import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  clerk_user_id: string
  email: string
  first_name?: string
  last_name?: string
  timezone: string
  role: 'admin' | 'staff'
  created_at: string
  updated_at: string
}

export interface BookingType {
  id: string
  user_id: string
  name: string
  duration: number
  description?: string
  price?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  booking_type_id: string
  user_id: string
  client_name: string
  client_email: string
  client_phone?: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  created_at: string
  updated_at: string
  google_calendar_event_id?: string
  zoom_meeting_id?: string
  zoom_join_url?: string
  zoom_password?: string
  zoho_contact_id?: string
}

export interface Availability {
  id: string
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface UserIntegration {
  id: string
  user_id: string
  provider: 'google' | 'zoom' | 'zoho'
  access_token: string
  refresh_token?: string
  expires_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}