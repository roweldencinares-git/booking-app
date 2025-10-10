import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseISO, addMinutes, format, isAfter, isBefore } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration') || '60')

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, date' },
        { status: 400 }
      )
    }

    // Get user's timezone
    const { data: user } = await supabase
      .from('users')
      .select('timezone')
      .eq('id', userId)
      .single()

    const timezone = user?.timezone || 'America/Chicago'

    const requestedDate = parseISO(date)
    const dayOfWeek = requestedDate.getDay()

    // Get user's availability for this day
    const { data: availability, error: availError } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .single()

    if (availError || !availability) {
      return NextResponse.json({ slots: [] })
    }

    // Get existing bookings for this date
    const startOfDay = format(requestedDate, 'yyyy-MM-dd') + 'T00:00:00Z'
    const endOfDay = format(requestedDate, 'yyyy-MM-dd') + 'T23:59:59Z'

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
    }

    // Generate time slots from availability
    const availableSlots: string[] = []
    const dateStr = format(requestedDate, 'yyyy-MM-dd')

    // Parse availability times in coach's timezone and convert to UTC
    const [startHour, startMin] = availability.start_time.split(':').map(Number)
    const [endHour, endMin] = availability.end_time.split(':').map(Number)

    // Create times in coach's timezone
    const startTimeLocal = `${dateStr}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`
    const endTimeLocal = `${dateStr}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`

    // Convert to UTC for comparison with bookings (which are stored in UTC)
    const startTime = fromZonedTime(startTimeLocal, timezone)
    const endTime = fromZonedTime(endTimeLocal, timezone)

    let currentSlot = startTime
    const now = new Date()

    console.log('=== Availability Debug ===')
    console.log('Requested date:', date)
    console.log('Day of week:', dayOfWeek)
    console.log('Availability found:', !!availability)
    console.log('Start time from DB:', availability.start_time)
    console.log('End time from DB:', availability.end_time)
    console.log('First slot time:', startTime.toISOString())
    console.log('Current server time:', now.toISOString())
    console.log('Is first slot after now?:', isAfter(startTime, now))
    console.log('Existing bookings found:', bookings?.length || 0)
    if (bookings && bookings.length > 0) {
      console.log('Bookings:', bookings.map(b => ({
        start: b.start_time,
        end: b.end_time
      })))
    }

    while (isBefore(addMinutes(currentSlot, duration), endTime) || currentSlot.getTime() === endTime.getTime()) {
      const slotEnd = addMinutes(currentSlot, duration)

      // Check if slot is in the past
      if (isAfter(currentSlot, now)) {
        // Check if slot conflicts with any booking
        const hasConflict = bookings?.some(booking => {
          const bookingStart = parseISO(booking.start_time)
          const bookingEnd = parseISO(booking.end_time)

          return (
            (currentSlot >= bookingStart && currentSlot < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (currentSlot <= bookingStart && slotEnd >= bookingEnd)
          )
        })

        if (!hasConflict) {
          // Convert back to coach's local time for display
          const slotInLocalTime = toZonedTime(currentSlot, timezone)
          availableSlots.push(format(slotInLocalTime, 'HH:mm'))
        }
      }

      currentSlot = addMinutes(currentSlot, 15) // Move in 15-minute increments
    }

    return NextResponse.json({ slots: availableSlots })

  } catch (error) {
    console.error('Error getting available slots:', error)
    return NextResponse.json(
      { error: 'Failed to get available slots' },
      { status: 500 }
    )
  }
}
