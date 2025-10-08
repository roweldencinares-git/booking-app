import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get the user with Google Calendar connected
  const { data: googleUser } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_calendar_connected, google_connected_at, google_token_expires_at')
    .eq('clerk_user_id', 'user_33WQ0C3nXBGkEioVemQMrLPWb1d')
    .single()

  if (!googleUser) {
    return NextResponse.json({ error: 'Google user not found' }, { status: 404 })
  }

  // Update the staff member (roweldencinares@gmail.com) with Google credentials
  const { data: updated, error } = await supabase
    .from('users')
    .update({
      google_access_token: googleUser.google_access_token,
      google_refresh_token: googleUser.google_refresh_token,
      google_calendar_connected: googleUser.google_calendar_connected,
      google_connected_at: googleUser.google_connected_at,
      google_token_expires_at: googleUser.google_token_expires_at
    })
    .eq('id', 'c238cd8f-a444-45ee-88e6-6c0e90b12d84')
    .select()

  return NextResponse.json({
    success: true,
    message: 'Google Calendar credentials synced to staff member',
    updated
  })
}
