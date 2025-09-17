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
      .select('id, clerk_user_id')
      .eq('id', id)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Check if Google OAuth credentials are configured
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri ||
        clientId === 'your_google_client_id_here' ||
        clientSecret === 'your_google_client_secret_here') {
      return NextResponse.json({
        message: 'Google Calendar integration setup required',
        authUrl: null,
        setup: {
          step1: 'Go to Google Cloud Console (console.cloud.google.com)',
          step2: 'Enable Google Calendar API',
          step3: 'Create OAuth 2.0 credentials',
          step4: 'Add redirect URI: ' + (redirectUri || 'http://localhost:3003/api/auth/google/callback'),
          step5: 'Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local'
        }
      })
    }

    // Generate Google OAuth URL
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ]

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: id // Include staff ID in state for callback
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return NextResponse.json({
      authUrl,
      message: 'Redirect to Google for authorization'
    })
  } catch (error) {
    console.error('Error setting up Google auth:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}