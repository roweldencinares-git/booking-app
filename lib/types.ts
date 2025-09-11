export interface BookingType {
  id: string;
  user_id: string;
  name: string;
  duration: number; // minutes
  description?: string;
  price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  user_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  booking_type_id: string;
  user_id: string; // host
  client_name: string;
  client_email: string;
  client_phone?: string;
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  booking_type?: BookingType;
}

export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}