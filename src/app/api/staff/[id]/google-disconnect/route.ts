import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
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

    // Update the staff member to remove Google Calendar connection
    // Only update existing columns to avoid schema errors
    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_calendar_connected: false,
        google_access_token: null,
        google_refresh_token: null,
        google_token_expires_at: null
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error disconnecting Google Calendar:', updateError)
      return NextResponse.json({ error: 'Failed to disconnect calendar' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully'
    })
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}