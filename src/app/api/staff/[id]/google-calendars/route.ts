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

    // For now, return a mock calendar list
    // In a real implementation, you would:
    // 1. Use the access token to call Google Calendar API
    // 2. Fetch the user's calendar list
    // 3. Return the actual calendars

    const mockCalendars = [
      {
        id: 'primary',
        summary: 'Primary Calendar',
        description: 'Your main Google Calendar',
        primary: true
      }
    ]

    return NextResponse.json({
      calendars: mockCalendars,
      connected: true,
      message: 'Google Calendar integration ready'
    })
  } catch (error) {
    console.error('Error fetching Google calendars:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}