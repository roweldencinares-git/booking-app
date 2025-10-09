import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  try {
    // Get guest token from cookie
    const guestToken = request.cookies.get('guest_calendar_token')?.value;

    if (!guestToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify and decode JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-in-production');
    const { payload } = await jwtVerify(guestToken, secret);

    const googleAccessToken = payload.googleAccessToken as string;
    const expiresAt = payload.expiresAt as number;

    // Check if token is expired
    if (Date.now() >= expiresAt) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate'); // YYYY-MM-DD

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 });
    }

    // Fetch events from Google Calendar
    const timeMin = new Date(startDate).toISOString();
    const timeMax = new Date(endDate + 'T23:59:59').toISOString();

    const calendarUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    calendarUrl.searchParams.append('timeMin', timeMin);
    calendarUrl.searchParams.append('timeMax', timeMax);
    calendarUrl.searchParams.append('singleEvents', 'true');
    calendarUrl.searchParams.append('orderBy', 'startTime');

    const calendarResponse = await fetch(calendarUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`
      }
    });

    if (!calendarResponse.ok) {
      console.error('Failed to fetch calendar events:', await calendarResponse.text());
      return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
    }

    const calendarData = await calendarResponse.json();

    // Format events for frontend
    const events = calendarData.items?.map((event: any) => ({
      summary: event.summary || 'Busy',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      status: event.status
    })) || [];

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching guest calendar events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
