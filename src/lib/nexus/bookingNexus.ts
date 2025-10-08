/**
 * NEXUS-Powered Booking Service
 *
 * 9-Layer autonomous execution for critical booking operations
 * - Auto-recovery from failures
 * - Intelligent monitoring and predictions
 * - Self-healing calendar integration
 */

import { nexusify } from './core'
import { createClient } from '@supabase/supabase-js'
import { GoogleCalendarService } from '../google-calendar'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateBookingInput {
  serviceId: string
  userId: string
  date: string
  time: string
  duration: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  notes?: string
  timezone?: string // Coach's timezone for proper time handling
}

export interface BookingResult {
  id: string
  booking_type_id: string
  user_id: string
  client_name: string
  client_email: string
  client_phone?: string
  start_time: string
  end_time: string
  notes?: string
  status: string
  google_calendar_event_id?: string | null
  created_at: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseTime(timeStr: string): { hour: number; minute: number } {
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

/**
 * Create a timezone-aware date from date string, time, and timezone
 * This ensures bookings are created in the coach's local time
 *
 * Example: date="2025-10-09", hour=14, minute=0, timezone="America/Chicago"
 * Returns: UTC time that corresponds to 2:00 PM Central Time (19:00 UTC if CDT, 20:00 UTC if CST)
 */
function createTimezoneAwareDate(
  dateStr: string,
  hour: number,
  minute: number,
  timezone: string
): Date {
  // Create a date string representing the local time in the specified timezone
  // Format: "2025-10-09T14:00:00"
  const localTimeStr = `${dateStr}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`

  // Strategy: Create date, format in target timezone, calculate offset
  // Step 1: Create an arbitrary UTC date
  const [year, month, day] = dateStr.split('-').map(Number)
  const utcReference = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))

  // Step 2: Format this date in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  const formatted = formatter.format(utcReference)
  // Format: "MM/DD/YYYY, HH:MM:SS"

  const [datePart, timePart] = formatted.split(', ')
  const [fMonth, fDay, fYear] = datePart.split('/')
  const [fHour, fMinute, fSecond] = timePart.split(':')

  // Step 3: Calculate the difference
  const tzHourDiff = parseInt(fHour) - hour
  const tzMinuteDiff = parseInt(fMinute) - minute

  // Step 4: Apply the reverse offset to get the correct UTC time
  const correctUtc = new Date(Date.UTC(
    year,
    month - 1,
    day,
    hour - tzHourDiff,
    minute - tzMinuteDiff,
    0
  ))

  return correctUtc
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ============================================================================
// CORE BOOKING LOGIC (Pure business logic - no error handling needed!)
// ============================================================================

async function createBookingCore(input: CreateBookingInput): Promise<BookingResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Validate email
  if (!validateEmail(input.customerEmail)) {
    throw new Error('Invalid email format')
  }

  // Get service details first to get coach timezone
  const { data: service, error: serviceError } = await supabase
    .from('booking_types')
    .select(`
      *,
      users!inner(first_name, last_name, email, timezone)
    `)
    .eq('id', input.serviceId)
    .single()

  if (serviceError || !service) {
    throw new Error('Service not found')
  }

  // Use coach's timezone from service or input, default to America/Chicago (Wisconsin)
  const timezone = input.timezone || service.users.timezone || 'America/Chicago'

  // Parse time and create timezone-aware datetime objects
  const { hour, minute } = parseTime(input.time)
  const startTime = createTimezoneAwareDate(input.date, hour, minute, timezone)
  const endTime = new Date(startTime)
  endTime.setMinutes(endTime.getMinutes() + input.duration)

  // Create booking in database
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      booking_type_id: input.serviceId,
      user_id: input.userId,
      client_name: input.customerName,
      client_email: input.customerEmail,
      client_phone: input.customerPhone,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      notes: input.notes,
      status: 'confirmed'
    })
    .select()
    .single()

  if (bookingError || !booking) {
    throw new Error(`Failed to save booking: ${bookingError?.message}`)
  }

  // Try to create Google Calendar event (non-critical)
  let calendarEventId: string | null = null
  try {
    const { data: user } = await supabase
      .from('users')
      .select('google_calendar_connected, google_access_token, google_refresh_token, google_token_expires_at, timezone')
      .eq('id', input.userId)
      .single()

    if (user?.google_calendar_connected && user.google_access_token) {
      const calendarService = new GoogleCalendarService(
        user.google_access_token,
        user.google_refresh_token,
        input.userId,
        user.google_token_expires_at ? new Date(user.google_token_expires_at) : undefined
      )

      const calendarEvent = await calendarService.createEvent('primary', {
        summary: `${service.name} - ${input.customerName}`,
        description: `
Booking Details:
- Service: ${service.name}
- Duration: ${input.duration} minutes
- Client: ${input.customerName}
- Email: ${input.customerEmail}
${input.customerPhone ? `- Phone: ${input.customerPhone}` : ''}
${input.notes ? `- Notes: ${input.notes}` : ''}

Meeting details will be provided separately.
        `.trim(),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: user.timezone || 'America/Chicago' // Default to Central Time
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: user.timezone || 'America/Chicago' // Default to Central Time
        },
        attendees: [
          {
            email: input.customerEmail,
            displayName: input.customerName
          }
        ]
      })

      calendarEventId = calendarEvent.id || null

      // Update booking with calendar event ID
      if (calendarEventId) {
        await supabase
          .from('bookings')
          .update({ google_calendar_event_id: calendarEventId })
          .eq('id', booking.id)
      }
    }
  } catch (calendarError) {
    // Calendar creation failed, but booking succeeded - log and continue
    console.warn('[NEXUS Booking] Calendar event creation failed (non-critical):', calendarError)
  }

  return {
    ...booking,
    google_calendar_event_id: calendarEventId
  } as BookingResult
}

// ============================================================================
// NEXUS-WRAPPED BOOKING OPERATION
// ============================================================================

/**
 * Create a new booking with NEXUS framework
 *
 * Features:
 * - Layer 1: Input validation and security scanning
 * - Layer 2: AI-powered intent analysis
 * - Layer 3: Data transformation and enrichment
 * - Layer 4: Business rule enforcement
 * - Layer 5: 3-tier auto-recovery (DB failure, Calendar failure, etc.)
 * - Layer 6: Result validation
 * - Layer 7: Response optimization
 * - Layer 8: Performance monitoring and failure prediction
 * - Layer 9: Pattern learning and continuous optimization
 */
export const createBooking = nexusify(
  createBookingCore,
  {
    service: 'booking-creation',
    mode: 'FULL' // Use all 9 layers for critical booking operations
  }
)

// ============================================================================
// ADDITIONAL NEXUS-WRAPPED OPERATIONS
// ============================================================================

async function cancelBookingCore(params: { bookingId: string; userId: string }): Promise<BookingResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get booking details
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*, users!inner(google_access_token, google_refresh_token, google_token_expires_at)')
    .eq('id', params.bookingId)
    .eq('user_id', params.userId)
    .single()

  if (fetchError || !booking) {
    throw new Error('Booking not found')
  }

  // Update booking status
  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', params.bookingId)
    .select()
    .single()

  if (updateError) {
    throw new Error('Failed to cancel booking')
  }

  // Try to delete Google Calendar event
  try {
    if (booking.google_calendar_event_id && booking.users?.google_access_token) {
      const calendarService = new GoogleCalendarService(
        booking.users.google_access_token,
        booking.users.google_refresh_token,
        params.userId,
        booking.users.google_token_expires_at ? new Date(booking.users.google_token_expires_at) : undefined
      )

      await calendarService.deleteEvent('primary', booking.google_calendar_event_id)
    }
  } catch (calendarError) {
    console.warn('[NEXUS Booking] Calendar deletion failed (non-critical):', calendarError)
  }

  return updated as BookingResult
}

export const cancelBooking = nexusify(
  cancelBookingCore,
  {
    service: 'booking-cancellation',
    mode: 'STANDARD' // Layers 1-7 for standard operations
  }
)

async function rescheduleBookingCore(params: {
  bookingId: string
  userId: string
  newDate: string
  newTime: string
}): Promise<BookingResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get current booking
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select(`
      *,
      booking_types!inner(duration_minutes),
      users!inner(google_access_token, google_refresh_token, google_token_expires_at, timezone)
    `)
    .eq('id', params.bookingId)
    .eq('user_id', params.userId)
    .single()

  if (fetchError || !booking) {
    throw new Error('Booking not found')
  }

  // Parse new time
  const { hour, minute } = parseTime(params.newTime)
  const newStartTime = new Date(params.newDate)
  newStartTime.setHours(hour, minute, 0, 0)
  const newEndTime = new Date(newStartTime)
  newEndTime.setMinutes(newEndTime.getMinutes() + booking.booking_types.duration_minutes)

  // Update booking
  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({
      start_time: newStartTime.toISOString(),
      end_time: newEndTime.toISOString()
    })
    .eq('id', params.bookingId)
    .select()
    .single()

  if (updateError) {
    throw new Error('Failed to reschedule booking')
  }

  // Try to update Google Calendar event
  try {
    if (booking.google_calendar_event_id && booking.users?.google_access_token) {
      const calendarService = new GoogleCalendarService(
        booking.users.google_access_token,
        booking.users.google_refresh_token,
        params.userId,
        booking.users.google_token_expires_at ? new Date(booking.users.google_token_expires_at) : undefined
      )

      await calendarService.updateEvent('primary', booking.google_calendar_event_id, {
        summary: `Rescheduled: ${booking.client_name}`,
        description: `Booking has been rescheduled.\n\nClient: ${booking.client_name}\nEmail: ${booking.client_email}`,
        start: {
          dateTime: newStartTime.toISOString(),
          timeZone: booking.users.timezone || 'America/Chicago' // Default to Central Time
        },
        end: {
          dateTime: newEndTime.toISOString(),
          timeZone: booking.users.timezone || 'America/Chicago' // Default to Central Time
        }
      })
    }
  } catch (calendarError) {
    console.warn('[NEXUS Booking] Calendar update failed (non-critical):', calendarError)
  }

  return updated as BookingResult
}

export const rescheduleBooking = nexusify(
  rescheduleBookingCore,
  {
    service: 'booking-reschedule',
    mode: 'STANDARD'
  }
)
