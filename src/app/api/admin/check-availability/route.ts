import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || '3b012c9c-f5c7-4bd1-9cd8-ea9106aadd64'

    // Get ALL availability records for this user
    const { data: availability, error } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    const formatted = availability?.map(a => ({
      day: `${dayNames[a.day_of_week]} (${a.day_of_week})`,
      available: a.is_available,
      hours: a.is_available ? `${a.start_time} - ${a.end_time}` : 'Not available'
    }))

    return NextResponse.json({
      userId,
      availability: formatted,
      raw: availability
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
