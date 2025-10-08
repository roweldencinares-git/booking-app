import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Update all coaches to Wisconsin timezone (Central Time)
  const { data: updated, error } = await supabase
    .from('users')
    .update({ timezone: 'America/Chicago' })
    .in('id', [
      'c238cd8f-a444-45ee-88e6-6c0e90b12d84', // roweldencinares@gmail.com
      '3b012c9c-f5c7-4bd1-9cd8-ea9106aadd64', // roweld.encinares@spearity.com
      '8ad8a379-bdcc-415b-9993-79bb3d2fa9a1'  // admin@booking.com
    ])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Updated all coaches to America/Chicago (Wisconsin - Central Time)',
    updated: updated?.map(u => ({
      email: u.email,
      timezone: u.timezone
    }))
  })
}
