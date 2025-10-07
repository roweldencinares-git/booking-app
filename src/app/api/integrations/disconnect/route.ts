import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, userId } = body;

    if (!service || !userId) {
      return NextResponse.json({ error: 'Service and userId required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Disconnect the specified service
    const updateData: any = {};

    if (service === 'google') {
      updateData.google_connected_at = null;
      updateData.google_calendar_email = null;
      updateData.google_access_token = null;
      updateData.google_refresh_token = null;
    } else if (service === 'zoom') {
      updateData.zoom_connected_at = null;
      updateData.zoom_account_name = null;
      updateData.zoom_access_token = null;
      updateData.zoom_refresh_token = null;
    } else {
      return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('Error disconnecting service:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${service} disconnected successfully`
    });
  } catch (error) {
    console.error('Error in disconnect endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
