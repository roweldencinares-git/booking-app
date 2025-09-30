import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    // If no user_id provided, try to use the authenticated userId or state from OAuth callback
    const targetUserId = user_id || state || userId

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 })
    }

    // If no code, redirect to Zoom OAuth
    if (!code) {
      const zoomClientId = process.env.ZOOM_CLIENT_ID
      if (!zoomClientId) {
        return NextResponse.json({ error: 'Zoom OAuth not configured' }, { status: 500 })
      }

      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL?.trim()}/api/auth/zoom`
      const scopes = 'meeting:write:meeting meeting:read:meeting user:read:user'
      const oauthState = targetUserId // Pass user_id as state

      const authUrl = new URL('https://zoom.us/oauth/authorize')
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('client_id', zoomClientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('scope', scopes)
      authUrl.searchParams.set('state', oauthState)

      const cleanAuthUrl = authUrl.toString().replace(/[\r\n]/g, '')
      return NextResponse.redirect(cleanAuthUrl)
    }

    // Handle OAuth callback - targetUserId already contains the state value

    // Exchange code for access token
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL?.trim()}/api/auth/zoom`
      })
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Zoom token exchange failed:', error)
      console.error('Status:', tokenResponse.status)
      console.error('Redirect URI used:', `${process.env.NEXT_PUBLIC_APP_URL?.trim()}/api/auth/zoom`)
      return NextResponse.json({
        error: 'Failed to exchange code for token',
        details: error,
        status: tokenResponse.status,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL?.trim()}/api/auth/zoom`
      }, { status: 500 })
    }

    const tokenData = await tokenResponse.json()

    // Get user info from Zoom
    const userResponse = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!userResponse.ok) {
      const userError = await userResponse.text()
      console.error('Failed to get Zoom user info:', userError)
      console.error('Status:', userResponse.status)
      return NextResponse.json({
        error: 'Failed to get user information',
        details: userError,
        status: userResponse.status
      }, { status: 500 })
    }

    const userData = await userResponse.json()

    // Store integration in database
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Calculate expiry time (1 hour from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    const { error: insertError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: targetUserId, // user_id from parameters or state
        provider: 'zoom',
        external_id: userData.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        metadata: {
          email: userData.email,
          display_name: userData.display_name,
          account_id: userData.account_id
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      })

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json({ error: 'Failed to store integration' }, { status: 500 })
    }

    // Redirect back to staff schedule page
    const finalRedirectUrl = `${process.env.NEXT_PUBLIC_APP_URL?.trim()}/admin/staff/${targetUserId}/schedule?zoom_connected=true`.replace(/[\r\n]/g, '')
    return NextResponse.redirect(finalRedirectUrl)

  } catch (error) {
    console.error('Error in Zoom OAuth:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}