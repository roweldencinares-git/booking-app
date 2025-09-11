import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { schedule } = body

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule data is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, delete existing availability for this user
    await supabase
      .from('availability')
      .delete()
      .eq('user_id', params.id)

    // Convert schedule object to availability records
    const availabilityRecords = Object.entries(schedule).map(([dayId, config]: [string, any]) => ({
      user_id: params.id,
      day_of_week: parseInt(dayId),
      start_time: `${config.start}:00`, // Convert "09:00" to "09:00:00"
      end_time: `${config.end}:00`,
      is_available: config.available
    }))

    // Insert new availability records
    const { data: availability, error } = await supabase
      .from('availability')
      .insert(availabilityRecords)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}