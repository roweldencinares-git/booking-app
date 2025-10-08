import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleCalendarService } from '@/lib/google-calendar'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the Wisconsin coach with Google Calendar connected
    const coachId = 'c238cd8f-a444-45ee-88e6-6c0e90b12d84'

    const { data: coach } = await supabase
      .from('users')
      .select('*')
      .eq('id', coachId)
      .single()

    if (!coach || !coach.google_calendar_connected) {
      return NextResponse.json({
        error: 'Coach not found or Google Calendar not connected'
      }, { status: 404 })
    }

    // Create Google Calendar service
    const calendarService = new GoogleCalendarService(
      coach.google_access_token,
      coach.google_refresh_token,
      coachId,
      coach.google_token_expires_at ? new Date(coach.google_token_expires_at) : undefined
    )

    // Test: Get busy times for today
    const today = new Date()
    const timeMin = new Date(today)
    timeMin.setHours(0, 0, 0, 0)

    const timeMax = new Date(today)
    timeMax.setHours(23, 59, 59, 999)

    console.log('Checking availability for:', {
      coach: coach.email,
      timezone: coach.timezone,
      date: today.toISOString().split('T')[0],
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString()
    })

    const busyTimes = await calendarService.getBusyTimes(
      'primary',
      timeMin.toISOString(),
      timeMax.toISOString()
    )

    return NextResponse.json({
      success: true,
      coach: {
        email: coach.email,
        timezone: coach.timezone,
        googleCalendarConnected: coach.google_calendar_connected
      },
      query: {
        date: today.toISOString().split('T')[0],
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString()
      },
      busyTimes: busyTimes.map(bt => ({
        start: bt.start,
        end: bt.end,
        startLocal: new Date(bt.start).toLocaleString('en-US', { timeZone: coach.timezone }),
        endLocal: new Date(bt.end).toLocaleString('en-US', { timeZone: coach.timezone })
      })),
      message: busyTimes.length === 0
        ? 'No conflicts found - all day is available!'
        : `Found ${busyTimes.length} busy time(s) on Google Calendar`
    })

  } catch (error: any) {
    console.error('Availability test error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
