import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // Clerk user ID
    const error = searchParams.get('error')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meetings.spearity.com';

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(`${appUrl}/admin/integrations?error=oauth_denied`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${appUrl}/admin/integrations?error=missing_code`)
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${appUrl}/api/auth/google/callback`
      })
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(`${appUrl}/admin/integrations?error=token_exchange_failed`)
    }

    const tokens = await tokenResponse.json()

    // Get user's calendar/email from Google Calendar API
    let calendarEmail = null;
    try {
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/settings/timezone', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (calendarResponse.ok) {
        // Get primary calendar to extract email
        const primaryCalendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
          headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        if (primaryCalendarResponse.ok) {
          const calendarData = await primaryCalendarResponse.json();
          calendarEmail = calendarData.id; // Calendar ID is usually the email
        }
      }
    } catch (e) {
      console.error('Error fetching calendar info:', e);
    }

    // Store tokens in database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_calendar_email: calendarEmail,
        google_connected_at: new Date().toISOString()
      })
      .eq('clerk_user_id', state)

    if (updateError) {
      console.error('Error storing tokens:', updateError)
      return NextResponse.redirect(`${appUrl}/admin/integrations?error=database_error`)
    }

    // Redirect back to integrations page
    return NextResponse.redirect(`${appUrl}/admin/integrations?success=google_connected`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'https://meetings.spearity.com'}/admin/integrations?error=callback_error`)
  }
}