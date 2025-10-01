import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to refresh Google access token
async function refreshGoogleToken(userId: string, refreshToken: string) {
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (!tokenResponse.ok) {
      console.error('Token refresh failed:', await tokenResponse.text())
      return null
    }

    const tokens = await tokenResponse.json()

    // Update database with new token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase
      .from('users')
      .update({
        google_access_token: tokens.access_token,
        google_token_expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString()
      })
      .eq('id', userId)

    return tokens.access_token
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

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
      .select('id, google_calendar_connected, google_access_token, google_refresh_token, google_token_expires_at, google_connected_at')
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

    // Check if connection is older than 6 months
    if (staff.google_connected_at) {
      const connectedAt = new Date(staff.google_connected_at).getTime()
      const now = Date.now()
      const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000 // 6 months in milliseconds

      if (now - connectedAt > sixMonths) {
        return NextResponse.json({
          calendars: [],
          connected: false,
          message: 'Google Calendar connection is more than 6 months old. Please reconnect for security.',
          needsReconnect: true
        })
      }
    }

    let accessToken = staff.google_access_token

    // Check if token is expired
    if (staff.google_token_expires_at) {
      const expiresAt = new Date(staff.google_token_expires_at).getTime()
      const now = Date.now()

      if (expiresAt < now) {
        console.log('Token expired, attempting refresh...')
        if (staff.google_refresh_token) {
          const newToken = await refreshGoogleToken(id, staff.google_refresh_token)
          if (newToken) {
            accessToken = newToken
            console.log('Token refreshed successfully')
          }
        }
      }
    }

    // Fetch calendars from Google Calendar API
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // If token is expired, try to refresh it one more time
        if (response.status === 401 && staff.google_refresh_token) {
          console.log('Got 401, attempting token refresh...')
          const newToken = await refreshGoogleToken(id, staff.google_refresh_token)
          if (newToken) {
            // Retry the request with new token
            const retryResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              }
            })

            if (retryResponse.ok) {
              const data = await retryResponse.json()
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
                message: 'Google Calendar integration ready (token refreshed)'
              })
            }
          }

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