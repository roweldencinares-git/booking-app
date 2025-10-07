import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user integrations
    const { data: user, error } = await supabase
      .from('users')
      .select('google_connected_at, google_calendar_email, google_access_token, zoom_connected_at, zoom_account_name, zoom_access_token')
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching integrations:', error);

      // If user not found, return empty integrations (not connected)
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          google: { connected: false },
          zoom: { connected: false }
        });
      }

      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    return NextResponse.json({
      google: {
        connected: !!user?.google_access_token,
        connectedAt: user?.google_connected_at,
        email: user?.google_calendar_email
      },
      zoom: {
        connected: !!user?.zoom_access_token,
        connectedAt: user?.zoom_connected_at,
        accountName: user?.zoom_account_name
      }
    });
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
