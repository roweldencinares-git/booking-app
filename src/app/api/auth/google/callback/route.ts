import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // Could be Clerk user ID or staff UUID
    const error = searchParams.get('error')

    const appUrl = 'https://meetings.spearity.com';
    const redirectUri = 'https://meetings.spearity.com/api/auth/google/callback';

    // Determine if this is a staff OAuth flow (UUID) or user integrations flow (Clerk ID)
    const isStaffFlow = state && state.length === 36 && state.includes('-'); // UUID format
    const isUserFlow = state && state.startsWith('user_'); // Clerk user ID format

    if (error) {
      console.error('OAuth error:', error)
      const errorRedirect = isStaffFlow
        ? `${appUrl}/admin/staff?error=oauth_denied`
        : `${appUrl}/admin/integrations?error=oauth_denied`;
      return NextResponse.redirect(errorRedirect)
    }

    if (!code || !state) {
      const errorRedirect = isStaffFlow
        ? `${appUrl}/admin/staff?error=missing_code`
        : `${appUrl}/admin/integrations?error=missing_code`;
      return NextResponse.redirect(errorRedirect)
    }

    console.log('Exchanging code for tokens with redirect_uri:', redirectUri);
    console.log('Flow type:', isStaffFlow ? 'staff' : 'user integrations');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
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

    // Handle staff flow (UUID) vs user integrations flow (Clerk ID)
    if (isStaffFlow) {
      // Staff OAuth flow - update by staff UUID
      const { error: updateError } = await supabase
        .from('users')
        .update({
          google_calendar_connected: true,
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
          google_connected_at: new Date().toISOString()
        })
        .eq('id', state);

      if (updateError) {
        console.error('Error storing tokens for staff:', updateError);
        return NextResponse.redirect(`${appUrl}/admin/staff?error=database_error`);
      }

      console.log('Successfully stored Google tokens for staff:', state);
      return NextResponse.redirect(`${appUrl}/admin/staff/${state}/schedule?success=calendar_connected`);
    } else {
      // User integrations flow - update by Clerk user ID
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, clerk_user_id')
        .eq('clerk_user_id', state)
        .single();

      console.log('User lookup:', { state, existingUser, userCheckError });

      if (!existingUser) {
        console.error('User not found with clerk_user_id:', state);
        return NextResponse.redirect(`${appUrl}/admin/integrations?error=user_not_found`);
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_calendar_connected: true,
          google_connected_at: new Date().toISOString()
        })
        .eq('clerk_user_id', state);

      if (updateError) {
        console.error('Error storing tokens:', updateError);
        return NextResponse.redirect(`${appUrl}/admin/integrations?error=database_error`);
      }

      console.log('Successfully stored Google tokens for user:', state);
      return NextResponse.redirect(`${appUrl}/admin/integrations?success=google_connected`);
    }
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'https://meetings.spearity.com'}/admin/integrations?error=callback_error`)
  }
}