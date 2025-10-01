import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleCalendarService } from '../../../../lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('=== BOOKING API CALLED ===')
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))

    const {
      serviceId,
      userId,
      date,
      time,
      duration,
      customerName,
      customerEmail,
      customerPhone,
      notes
    } = body

    console.log('Extracted fields:', {
      serviceId,
      userId,
      date,
      time,
      duration,
      customerName,
      customerEmail,
      customerPhone,
      notes
    })

    // Validate required fields
    if (!serviceId || !userId || !date || !time || !duration || !customerName || !customerEmail) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Parse time (handle both 12-hour and 24-hour formats)
    const parseTime = (timeStr: string) => {
      // Handle 12-hour format (e.g., "4:15 am", "2:30 pm")
      if (timeStr.includes('am') || timeStr.includes('pm')) {
        const [timePart, period] = timeStr.split(' ')
        const [hourStr, minuteStr] = timePart.split(':')
        let hour = parseInt(hourStr)
        const minute = parseInt(minuteStr || '0')

        if (period === 'pm' && hour !== 12) hour += 12
        if (period === 'am' && hour === 12) hour = 0

        return { hour, minute }
      }

      // Handle 24-hour format (e.g., "14:30", "09:15")
      const [hourStr, minuteStr] = timeStr.split(':')
      return {
        hour: parseInt(hourStr),
        minute: parseInt(minuteStr || '0')
      }
    }

    const { hour, minute } = parseTime(time)
    const startTime = new Date(date)
    startTime.setHours(hour, minute, 0, 0)
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + duration)

    // Get service and user details
    const { data: service } = await supabase
      .from('booking_types')
      .select(`
        *,
        users!inner(first_name, last_name, email)
      `)
      .eq('id', serviceId)
      .single()

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Save booking to database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_type_id: serviceId,
        user_id: userId,
        client_name: customerName,
        client_email: customerEmail,
        client_phone: customerPhone,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: notes,
        status: 'confirmed'
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Database booking error:', bookingError)
      return NextResponse.json(
        { error: 'Failed to save booking' },
        { status: 500 }
      )
    }

    // Try to create Google Calendar event
    let calendarEventId = null
    try {
      console.log('Looking for Google Calendar integration for userId:', userId)

      // Get user's Google Calendar integration from users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('google_calendar_connected, google_access_token, google_refresh_token, google_token_expires_at')
        .eq('id', userId)
        .single()

      console.log('User query result:', { user, userError })

      if (user && user.google_calendar_connected && user.google_access_token) {
        console.log('Found Google Calendar integration, creating event...')
        const calendarService = new GoogleCalendarService(
          user.google_access_token,
          user.google_refresh_token,
          userId,
          user.google_token_expires_at ? new Date(user.google_token_expires_at) : undefined
        )

        // Create calendar event
        const calendarEvent = await calendarService.createEvent('primary', {
          summary: `${service.name} - ${customerName}`,
          description: `
Booking Details:
- Service: ${service.name}
- Duration: ${duration} minutes
- Client: ${customerName}
- Email: ${customerEmail}
${customerPhone ? `- Phone: ${customerPhone}` : ''}
${notes ? `- Notes: ${notes}` : ''}

Meeting details will be provided separately.
          `.trim(),
          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'Asia/Manila'
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'Asia/Manila'
          },
          attendees: [
            {
              email: customerEmail,
              displayName: customerName
            }
          ]
        })

        calendarEventId = calendarEvent.id

        // Update booking with calendar event ID
        await supabase
          .from('bookings')
          .update({ google_calendar_event_id: calendarEventId })
          .eq('id', booking.id)

        console.log('Calendar event created successfully:', calendarEventId)
      } else {
        console.log('No Google Calendar integration found for user')
      }
    } catch (calendarError) {
      console.error('Calendar creation error (non-critical):', calendarError)
      // Don't fail the booking if calendar creation fails
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        calendar_event_id: calendarEventId
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}