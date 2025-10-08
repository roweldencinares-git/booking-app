import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const coachId = searchParams.get('coachId')
    const date = searchParams.get('date')

    if (!coachId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: coachId, date' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get coach timezone
    const { data: coach } = await supabase
      .from('users')
      .select('timezone')
      .eq('id', coachId)
      .single()

    const timezone = coach?.timezone || 'America/Chicago'

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay()

    // Get availability for that day
    const { data: availability } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', coachId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .single()

    if (!availability) {
      return NextResponse.json({ slots: [] })
    }

    // Generate time slots (every 15 minutes)
    const slots = []
    const [startHour, startMinute] = availability.start_time.split(':').map(Number)
    const [endHour, endMinute] = availability.end_time.split(':').map(Number)

    let currentHour = startHour
    let currentMinute = startMinute

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      // Format time
      const hour12 = currentHour % 12 || 12
      const ampm = currentHour < 12 ? 'AM' : 'PM'
      const minuteStr = currentMinute.toString().padStart(2, '0')
      const timeStr = `${hour12}:${minuteStr} ${ampm}`

      slots.push(timeStr)

      // Increment by 15 minutes
      currentMinute += 15
      if (currentMinute >= 60) {
        currentMinute = 0
        currentHour += 1
      }
    }

    return NextResponse.json({ slots, timezone })
  } catch (error) {
    console.error('Error getting availability:', error)
    return NextResponse.json(
      { error: 'Failed to get availability' },
      { status: 500 }
    )
  }
}
