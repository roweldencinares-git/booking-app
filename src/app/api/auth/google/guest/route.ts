import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const returnUrl = searchParams.get('returnUrl') || '/';

    // Build Google OAuth URL for guest users (read-only calendar access)
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const redirectUri = 'https://meetings.spearity.com/api/auth/google/guest/callback';

    googleAuthUrl.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar.readonly');
    googleAuthUrl.searchParams.append('access_type', 'online'); // No refresh token needed for guests
    googleAuthUrl.searchParams.append('state', Buffer.from(returnUrl).toString('base64')); // Encode return URL

    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error) {
    console.error('Error initiating guest Google OAuth:', error);
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
  }
}
