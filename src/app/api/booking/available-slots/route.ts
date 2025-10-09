import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseISO, addMinutes, format, isAfter, isBefore } from 'date-fns'

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

    // Create date/time in UTC for comparison (times in DB are coach's local time)
    // Parse as local time first, then convert to compare with server's now()
    const startTime = parseISO(`${dateStr}T${availability.start_time}`)
    const endTime = parseISO(`${dateStr}T${availability.end_time}`)

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
          availableSlots.push(format(currentSlot, 'HH:mm'))
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
