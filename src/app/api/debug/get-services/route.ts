import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: services } = await supabase
    .from('booking_types')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({
    services: services?.map(s => ({
      id: s.id,
      name: s.name,
      duration: s.duration_minutes,
      userId: s.user_id,
      isActive: s.is_active
    }))
  })
}
