import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AvailabilityContent from '@/components/AvailabilityContent'

export const dynamic = 'force-dynamic'

interface AvailabilitySettings {
  id?: string
  user_id: string
  timezone: string
  weekly_hours: {
    [key: string]: {
      enabled: boolean
      start: string
      end: string
    }
  }
  date_overrides: {
    [key: string]: {
      available: boolean
      start?: string
      end?: string
      reason?: string
    }
  }
}

export default async function AvailabilityPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get user from database
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!dbUser) {
    redirect('/sign-in')
  }

  // Fetch user's availability settings
  const { data: availabilityData, error } = await supabase
    .from('user_availability')
    .select('*')
    .eq('user_id', dbUser.id)
    .single()

  // Default availability settings
  const defaultSettings: AvailabilitySettings = {
    user_id: dbUser.id,
    timezone: 'America/New_York',
    weekly_hours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' }
    },
    date_overrides: {}
  }

  const availability: AvailabilitySettings = availabilityData ? {
    ...availabilityData,
    weekly_hours: availabilityData.weekly_hours || defaultSettings.weekly_hours,
    date_overrides: availabilityData.date_overrides || defaultSettings.date_overrides
  } : defaultSettings

  // Get existing booking types for this user
  const { data: bookingTypes } = await supabase
    .from('booking_types')
    .select('id, name, duration, active')
    .eq('created_by', dbUser.id)
    .eq('active', true)

  return (
    <AvailabilityContent
      availability={availability}
      bookingTypes={bookingTypes || []}
      userId={dbUser.id}
    />
  )
}