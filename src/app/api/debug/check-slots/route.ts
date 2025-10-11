import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseISO, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || '3b012c9c-f5c7-4bd1-9cd8-ea9106aadd64'
    const date = searchParams.get('date') // e.g., "2025-10-13"

    if (!date) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 })
    }

    const requestedDate = parseISO(date)
    const dayOfWeek = requestedDate.getDay()
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    // Check availability for this day
    const { data: availability, error: availError } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)

    // Check for existing bookings on this date
    const startOfDay = format(requestedDate, 'yyyy-MM-dd') + 'T00:00:00Z'
    const endOfDay = format(requestedDate, 'yyyy-MM-dd') + 'T23:59:59Z'

    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)

    // Get available slots from the API
    const slotsResponse = await fetch(
      `${request.nextUrl.origin}/api/booking/available-slots?userId=${userId}&date=${date}&duration=60`
    )
    const slotsData = await slotsResponse.json()

    return NextResponse.json({
      date,
      dayOfWeek: `${dayOfWeek} (${dayNames[dayOfWeek]})`,
      availability: availability || [],
      availabilityFound: !!availability && availability.length > 0,
      isAvailable: availability && availability.length > 0 && availability[0].is_available,
      bookingsOnThisDate: bookings || [],
      bookingsCount: bookings?.length || 0,
      availableSlots: slotsData.slots || [],
      slotsCount: slotsData.slots?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
