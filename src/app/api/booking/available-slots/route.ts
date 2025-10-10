import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseISO, addMinutes, format, isAfter, isBefore } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { GoogleCalendarService } from '@/lib/google-calendar'

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

    // Get user's timezone and Google Calendar integration
    const { data: user } = await supabase
      .from('users')
      .select('timezone, google_calendar_connected, google_access_token, google_refresh_token, google_token_expires_at')
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

    // Get Google Calendar busy times if connected
    let googleBusyTimes: Array<{start: string, end: string}> = []
    if (user?.google_calendar_connected && user?.google_access_token && user?.google_refresh_token) {
      try {
        const calendarService = new GoogleCalendarService(
          user.google_access_token,
          user.google_refresh_token,
          userId,
          user.google_token_expires_at ? new Date(user.google_token_expires_at) : undefined
        )
        googleBusyTimes = await calendarService.getBusyTimes('primary', startOfDay, endOfDay)
        console.log('Google Calendar busy times found:', googleBusyTimes.length)
        if (googleBusyTimes.length > 0) {
          console.log('Google busy times:', googleBusyTimes)
        }
      } catch (calendarError) {
        console.error('Error fetching Google Calendar busy times:', calendarError)
        // Continue without Google Calendar conflicts
      }
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

    while (isBefore(addMinutes(currentSlot, duration), endTime) || currentSlot.getTime() === endTime.getTime()) {
      const slotEnd = addMinutes(currentSlot, duration)
      const slotInLocalTime = toZonedTime(currentSlot, timezone)
      const slotTimeStr = format(slotInLocalTime, 'HH:mm')

      // Check if slot is in the past
      if (isAfter(currentSlot, now)) {
        // Check if slot conflicts with any booking in database
        const hasBookingConflict = bookings?.some(booking => {
          const bookingStart = parseISO(booking.start_time)
          const bookingEnd = parseISO(booking.end_time)

          return (
            (currentSlot >= bookingStart && currentSlot < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (currentSlot <= bookingStart && slotEnd >= bookingEnd)
          )
        })

        // Check if slot conflicts with Google Calendar events
        const hasGoogleConflict = googleBusyTimes.some(busyTime => {
          const busyStart = parseISO(busyTime.start)
          const busyEnd = parseISO(busyTime.end)

          return (
            (currentSlot >= busyStart && currentSlot < busyEnd) ||
            (slotEnd > busyStart && slotEnd <= busyEnd) ||
            (currentSlot <= busyStart && slotEnd >= busyEnd)
          )
        })

        if (!hasBookingConflict && !hasGoogleConflict) {
          // Convert back to coach's local time for display
          availableSlots.push(slotTimeStr)
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
