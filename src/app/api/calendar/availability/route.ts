import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'
import { format, parse } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const coachId = searchParams.get('coachId')
    const serviceId = searchParams.get('serviceId')
    const date = searchParams.get('date')
    const clientTimezone = searchParams.get('clientTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone

    if (!coachId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: coachId, serviceId, date' },
        { status: 400 }
      )
    }

    // Use the timezone-aware availability logic
    return getAvailabilitySlots(coachId, date, clientTimezone)
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
    const { date, duration, serviceId, clientTimezone } = await request.json()

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: date, serviceId' },
        { status: 400 }
      )
    }

    const timezone = clientTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone

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

    // Get availability slots in client's timezone
    return getAvailabilitySlots(service.user_id, date, timezone)
  } catch (error) {
    console.error('Calendar availability error:', error)

    // Return fallback slots if calendar service fails
    return NextResponse.json({
      success: false,
      availableSlots: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
      message: 'Using fallback availability (calendar service unavailable)'
    })
  }
}

async function getAvailabilitySlots(coachId: string, dateStr: string, clientTimezone: string) {
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

  const coachTimezone = coach?.timezone || 'America/Chicago'

  // Get day of week in COACH'S timezone (since availability is set in coach's local time)
  const selectedDateInCoachTz = toZonedTime(dateStr, coachTimezone)
  const dayOfWeek = selectedDateInCoachTz.getDay()

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
      coachTimezone,
      message: 'No availability for this day'
    })
  }

  // Get existing bookings to check conflicts
  const startOfDay = formatInTimeZone(selectedDateInCoachTz, coachTimezone, 'yyyy-MM-dd') + 'T00:00:00'
  const endOfDay = formatInTimeZone(selectedDateInCoachTz, coachTimezone, 'yyyy-MM-dd') + 'T23:59:59'

  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('user_id', coachId)
    .eq('status', 'confirmed')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)

  // Generate time slots (every 15 minutes) in COACH'S timezone
  const slots = []
  const [startHour, startMinute] = availability.start_time.split(':').map(Number)
  const [endHour, endMinute] = availability.end_time.split(':').map(Number)

  let currentHour = startHour
  let currentMinute = startMinute
  const now = new Date()

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    // Create datetime in coach's timezone
    const dateInCoachTz = formatInTimeZone(selectedDateInCoachTz, coachTimezone, 'yyyy-MM-dd')
    const timeStr24 = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
    const datetimeStr = `${dateInCoachTz}T${timeStr24}:00`

    // Convert to UTC for comparison
    const slotTimeUTC = fromZonedTime(datetimeStr, coachTimezone)

    // Check if slot is in the future
    if (slotTimeUTC > now) {
      // Check for booking conflicts
      const hasConflict = bookings?.some(booking => {
        const bookingStart = new Date(booking.start_time)
        const bookingEnd = new Date(booking.end_time)
        return slotTimeUTC >= bookingStart && slotTimeUTC < bookingEnd
      })

      if (!hasConflict) {
        // Convert to client's timezone for display
        const slotInClientTz = formatInTimeZone(slotTimeUTC, clientTimezone, 'h:mm a')
        slots.push(slotInClientTz)
      }
    }

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
    coachTimezone,
    clientTimezone
  })
}
