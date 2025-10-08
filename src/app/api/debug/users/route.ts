import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: users } = await supabase
    .from('users')
    .select('id, clerk_user_id, email, first_name, last_name, google_calendar_connected, google_access_token, google_connected_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    users: users?.map(u => ({
      id: u.id,
      clerk_user_id: u.clerk_user_id,
      email: u.email,
      name: `${u.first_name} ${u.last_name}`,
      google_calendar_connected: u.google_calendar_connected,
      has_google_token: !!u.google_access_token,
      google_connected_at: u.google_connected_at
    }))
  })
}
