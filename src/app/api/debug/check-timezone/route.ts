import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get user details with timezone
  const { data: users } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, timezone, google_calendar_connected')
    .order('created_at', { ascending: false })

  // Get availability settings
  const { data: availability } = await supabase
    .from('availability')
    .select('*')
    .order('user_id, day_of_week')

  // Get recent bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, user_id, client_name, start_time, end_time, status, google_calendar_event_id')
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    users: users?.map(u => ({
      id: u.id,
      email: u.email,
      name: `${u.first_name} ${u.last_name}`,
      timezone: u.timezone || 'NOT SET',
      googleCalendar: u.google_calendar_connected ? 'Connected' : 'Not Connected'
    })),
    availability: availability?.map(a => ({
      userId: a.user_id,
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][a.day_of_week],
      startTime: a.start_time,
      endTime: a.end_time,
      isAvailable: a.is_available
    })),
    recentBookings: bookings?.map(b => ({
      id: b.id,
      userId: b.user_id,
      client: b.client_name,
      start: b.start_time,
      end: b.end_time,
      status: b.status,
      hasCalendarEvent: !!b.google_calendar_event_id
    }))
  })
}
