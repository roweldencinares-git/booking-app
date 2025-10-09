import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const appUrl = 'https://meetings.spearity.com';
    const redirectUri = 'https://meetings.spearity.com/api/auth/google/guest/callback';

    if (error) {
      console.error('Guest OAuth error:', error);
      return NextResponse.redirect(`${appUrl}?calendar_error=denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}?calendar_error=no_code`);
    }

    // Exchange code for access token
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
    });

    if (!tokenResponse.ok) {
      console.error('Guest token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${appUrl}?calendar_error=token_failed`);
    }

    const tokens = await tokenResponse.json();

    // Create a signed JWT token to store guest's access token securely
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-in-production');
    const guestToken = await new SignJWT({
      googleAccessToken: tokens.access_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);

    // Decode return URL
    const returnUrl = state ? Buffer.from(state, 'base64').toString('utf-8') : '/';

    // Redirect back to booking page with token
    const response = NextResponse.redirect(`${appUrl}${returnUrl}?calendar_connected=true`);

    // Set HTTP-only cookie with guest token (expires in 1 hour)
    response.cookies.set('guest_calendar_token', guestToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Guest OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'https://meetings.spearity.com'}?calendar_error=callback_failed`);
  }
}
