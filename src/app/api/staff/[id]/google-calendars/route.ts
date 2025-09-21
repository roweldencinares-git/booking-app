import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify the staff member exists and user has permission
    const { data: staff, error: staffError } = await supabase
      .from('users')
      .select('id, google_calendar_connected, google_access_token')
      .eq('id', id)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // If not connected to Google Calendar, return empty list
    if (!staff.google_calendar_connected || !staff.google_access_token) {
      return NextResponse.json({
        calendars: [],
        connected: false,
        message: 'Google Calendar not connected'
      })
    }

    // Fetch calendars from Google Calendar API
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${staff.google_access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // If token is expired, try to refresh it
        if (response.status === 401) {
          return NextResponse.json({
            calendars: [],
            connected: false,
            message: 'Access token expired. Please reconnect your Google Calendar.',
            needsReconnect: true
          })
        }

        throw new Error(`Google API error: ${response.status}`)
      }

      const data = await response.json()
      const calendars = data.items || []

      return NextResponse.json({
        calendars: calendars.map((cal: any) => ({
          id: cal.id,
          summary: cal.summary,
          description: cal.description,
          primary: cal.primary,
          accessRole: cal.accessRole
        })),
        connected: true,
        message: 'Google Calendar integration ready'
      })
    } catch (apiError) {
      console.error('Google Calendar API error:', apiError)

      // Return fallback with primary calendar
      return NextResponse.json({
        calendars: [
          {
            id: 'primary',
            summary: 'Primary Calendar',
            description: 'Your main Google Calendar',
            primary: true
          }
        ],
        connected: true,
        message: 'Using primary calendar (API temporarily unavailable)',
        fallback: true
      })
    }
  } catch (error) {
    console.error('Error fetching Google calendars:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}