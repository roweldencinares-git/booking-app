import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const coachId = searchParams.get('coachId')
    const serviceId = searchParams.get('serviceId')
    const date = searchParams.get('date')

    if (!coachId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: coachId, serviceId, date' },
        { status: 400 }
      )
    }

    // Use the simple availability logic
    return getAvailabilitySlots(coachId, date)
  } catch (error) {
    console.error('Calendar availability error:', error)
    return NextResponse.json(
      { error: 'Failed to get availability' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, duration, serviceId } = await request.json()

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: date, serviceId' },
        { status: 400 }
      )
    }

    // Get coach ID from service
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: service } = await supabase
      .from('booking_types')
      .select('user_id')
      .eq('id', serviceId)
      .single()

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Get availability slots
    return getAvailabilitySlots(service.user_id, date)
  } catch (error) {
    console.error('Calendar availability error:', error)

    // Return fallback slots if calendar service fails (Wisconsin business hours)
    return NextResponse.json({
      success: false,
      availableSlots: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
      message: 'Using fallback availability (calendar service unavailable)'
    })
  }
}

async function getAvailabilitySlots(coachId: string, dateStr: string) {
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
  const selectedDate = new Date(dateStr)
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
    return NextResponse.json({
      success: true,
      availableSlots: [],
      message: 'No availability for this day'
    })
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
    // Format time in 12-hour format
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

  return NextResponse.json({
    success: true,
    availableSlots: slots,
    timezone
  })
}
