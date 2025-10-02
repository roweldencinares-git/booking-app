import { supabase, type Booking } from './supabase'
import { GoogleCalendarService, type CalendarEvent } from './google-calendar'
import { createMeetingService } from './meetingService'
import { addMinutes, isAfter, isBefore, parseISO, format } from 'date-fns'

// Input types for booking operations
export interface CreateBookingInput {
  bookingTypeId: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  startTime: string // ISO string
  notes?: string
  timezone?: string
}

export interface RescheduleBookingInput {
  newStartTime: string // ISO string
  notes?: string
}

export interface BookingResult {
  booking: Booking
  googleCalendarEventId?: string
  zoomMeetingId?: string
  zohoContactId?: string
}

export class BookingService {
  private googleCalendar?: GoogleCalendarService

  constructor(
    private userId: string,
    googleAccessToken?: string,
    googleRefreshToken?: string,
    googleTokenExpiryDate?: string
  ) {
    if (googleAccessToken && googleRefreshToken) {
      this.googleCalendar = new GoogleCalendarService(
        googleAccessToken,
        googleRefreshToken,
        userId,
        googleTokenExpiryDate ? new Date(googleTokenExpiryDate) : undefined
      )
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(input: CreateBookingInput): Promise<BookingResult> {
    // Start a transaction
    const { data: bookingType, error: bookingTypeError } = await supabase
      .from('booking_types')
      .select('*')
      .eq('id', input.bookingTypeId)
      .eq('is_active', true)
      .single()

    if (bookingTypeError || !bookingType) {
      throw new Error('Booking type not found or inactive')
    }

    // Calculate end time
    const startTime = parseISO(input.startTime)
    const endTime = addMinutes(startTime, bookingType.duration)

    // Validate the time slot
    await this.validateTimeSlot(bookingType.user_id, input.startTime, endTime.toISOString())

    // Check for conflicts
    const hasConflict = await this.checkForConflicts(
      bookingType.user_id,
      input.startTime,
      endTime.toISOString()
    )

    if (hasConflict) {
      throw new Error('Time slot is already booked')
    }

    // Create booking in database with transaction
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_type_id: input.bookingTypeId,
        user_id: bookingType.user_id,
        client_name: input.clientName,
        client_email: input.clientEmail,
        client_phone: input.clientPhone,
        start_time: input.startTime,
        end_time: endTime.toISOString(),
        status: 'confirmed',
        notes: input.notes
      })
      .select()
      .single()

    if (bookingError || !booking) {
      throw new Error(`Failed to create booking: ${bookingError?.message}`)
    }

    // Create Google Calendar event if available
    let googleCalendarEventId: string | undefined
    if (this.googleCalendar) {
      try {
        const calendarEvent: CalendarEvent = {
          summary: `${bookingType.name} - ${input.clientName}`,
          description: `Booking with ${input.clientName}\nEmail: ${input.clientEmail}\nPhone: ${input.clientPhone || 'N/A'}\nNotes: ${input.notes || 'N/A'}`,
          start: {
            dateTime: input.startTime,
            timeZone: input.timezone || 'America/New_York'
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: input.timezone || 'America/New_York'
          },
          attendees: [
            {
              email: input.clientEmail,
              displayName: input.clientName
            }
          ]
        }

        const calendarResponse = await this.googleCalendar.createEvent('primary', calendarEvent)
        googleCalendarEventId = calendarResponse.id

        // Update booking with calendar event ID
        if (googleCalendarEventId) {
          await supabase
            .from('bookings')
            .update({ google_calendar_event_id: googleCalendarEventId })
            .eq('id', booking.id)
        }
      } catch (calendarError) {
        console.error('Failed to create calendar event:', calendarError)
        // Don't fail the entire booking if calendar creation fails
      }
    }

    // Create Zoom meeting using user's OAuth token
    let zoomMeetingId: string | undefined
    try {
      const meetingService = createMeetingService(this.userId)
      const meetingResult = await meetingService.createZoomMeeting(booking)
      zoomMeetingId = meetingResult.meetingId
    } catch (meetingError) {
      console.error('Failed to create Zoom meeting:', meetingError)
      // Don't fail the entire booking if meeting creation fails
    }

    return {
      booking: { 
        ...booking, 
        google_calendar_event_id: googleCalendarEventId,
        zoom_meeting_id: zoomMeetingId
      },
      googleCalendarEventId,
      zoomMeetingId,
      // TODO: Implement Zoho integration
      zohoContactId: undefined
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string): Promise<boolean> {
    // Get the booking first
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', this.userId)
      .single()

    if (fetchError || !booking) {
      throw new Error('Booking not found')
    }

    if (booking.status === 'cancelled') {
      throw new Error('Booking is already cancelled')
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (updateError) {
      throw new Error(`Failed to cancel booking: ${updateError.message}`)
    }

    // Cancel Google Calendar event if exists
    if (this.googleCalendar && booking.google_calendar_event_id) {
      try {
        await this.googleCalendar.deleteEvent('primary', booking.google_calendar_event_id)
      } catch (calendarError) {
        console.error('Failed to cancel calendar event:', calendarError)
        // Don't fail if calendar cancellation fails
      }
    }

    // Cancel Zoom meeting if exists
    if (booking.zoom_meeting_id) {
      try {
        const meetingService = createMeetingService(this.userId)
        await meetingService.deleteZoomMeeting(booking)
      } catch (meetingError) {
        console.error('Failed to cancel Zoom meeting:', meetingError)
        // Don't fail if meeting cancellation fails
      }
    }

    return true
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(bookingId: string, input: RescheduleBookingInput): Promise<BookingResult> {
    // Get the existing booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_types (*)
      `)
      .eq('id', bookingId)
      .eq('user_id', this.userId)
      .single()

    if (fetchError || !booking) {
      throw new Error('Booking not found')
    }

    if (booking.status === 'cancelled') {
      throw new Error('Cannot reschedule a cancelled booking')
    }

    const bookingType = (booking as Booking & { booking_types: any }).booking_types
    if (!bookingType) {
      throw new Error('Booking type not found')
    }

    // Calculate new end time
    const newStartTime = parseISO(input.newStartTime)
    const newEndTime = addMinutes(newStartTime, bookingType.duration)

    // Validate the new time slot
    await this.validateTimeSlot(booking.user_id, input.newStartTime, newEndTime.toISOString())

    // Check for conflicts (excluding the current booking)
    const hasConflict = await this.checkForConflicts(
      booking.user_id,
      input.newStartTime,
      newEndTime.toISOString(),
      bookingId
    )

    if (hasConflict) {
      throw new Error('New time slot is already booked')
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        start_time: input.newStartTime,
        end_time: newEndTime.toISOString(),
        notes: input.notes || booking.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (updateError || !updatedBooking) {
      throw new Error(`Failed to reschedule booking: ${updateError?.message}`)
    }

    // Update Google Calendar event if exists
    if (this.googleCalendar && booking.google_calendar_event_id) {
      try {
        const calendarEvent: CalendarEvent = {
          summary: `${bookingType.name} - ${booking.client_name}`,
          description: `Booking with ${booking.client_name}\nEmail: ${booking.client_email}\nPhone: ${booking.client_phone || 'N/A'}\nNotes: ${input.notes || booking.notes || 'N/A'}`,
          start: {
            dateTime: input.newStartTime,
            timeZone: 'America/New_York' // TODO: Get from user preferences
          },
          end: {
            dateTime: newEndTime.toISOString(),
            timeZone: 'America/New_York'
          },
          attendees: [
            {
              email: booking.client_email,
              displayName: booking.client_name
            }
          ]
        }

        await this.googleCalendar.updateEvent('primary', booking.google_calendar_event_id, calendarEvent)
      } catch (calendarError) {
        console.error('Failed to update calendar event:', calendarError)
        // Don't fail if calendar update fails
      }
    }

    // Update Zoom meeting if exists
    let zoomMeetingId: string | undefined
    if (booking.zoom_meeting_id) {
      try {
        const meetingService = createMeetingService(this.userId)
        const meetingResult = await meetingService.updateZoomMeeting(updatedBooking)
        zoomMeetingId = meetingResult.meetingId
      } catch (meetingError) {
        console.error('Failed to update Zoom meeting:', meetingError)
        // Don't fail if meeting update fails
      }
    }

    return {
      booking: updatedBooking,
      googleCalendarEventId: booking.google_calendar_event_id,
      zoomMeetingId: zoomMeetingId || booking.zoom_meeting_id,
      // TODO: Update Zoho integration
      zohoContactId: undefined
    }
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<Booking | null> {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_types (*)
      `)
      .eq('id', bookingId)
      .eq('user_id', this.userId)
      .single()

    if (error) {
      return null
    }

    return booking
  }

  /**
   * List bookings with filters
   */
  async listBookings(filters?: {
    status?: 'confirmed' | 'cancelled' | 'completed'
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<Booking[]> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        booking_types (name, duration, description)
      `)
      .eq('user_id', this.userId)
      .order('start_time', { ascending: true })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('start_time', filters.endDate)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data: bookings, error } = await query

    if (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`)
    }

    return bookings || []
  }

  /**
   * Check if a time slot is available
   */
  async isTimeSlotAvailable(startTime: string, endTime: string): Promise<boolean> {
    try {
      await this.validateTimeSlot(this.userId, startTime, endTime)
      const hasConflict = await this.checkForConflicts(this.userId, startTime, endTime)
      return !hasConflict
    } catch {
      return false
    }
  }

  /**
   * Private method to validate time slot against availability
   */
  private async validateTimeSlot(userId: string, startTime: string, endTime: string): Promise<void> {
    const start = parseISO(startTime)
    const end = parseISO(endTime)
    const dayOfWeek = start.getDay()

    // Check if the time slot falls within available hours
    const { data: availability, error } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .single()

    if (error || !availability) {
      throw new Error('No availability set for this day')
    }

    // Parse availability times as UTC to match the booking times
    const dateStr = format(start, 'yyyy-MM-dd')
    const availableStart = new Date(`${dateStr}T${availability.start_time}Z`)
    const availableEnd = new Date(`${dateStr}T${availability.end_time}Z`)

    if (isBefore(start, availableStart) || isAfter(end, availableEnd)) {
      throw new Error(`Time slot is outside available hours (${availability.start_time} - ${availability.end_time} UTC)`)
    }

    // Ensure booking is not in the past
    if (isBefore(start, new Date())) {
      throw new Error('Cannot book time slots in the past')
    }
  }

  /**
   * Private method to check for booking conflicts
   */
  private async checkForConflicts(
    userId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`)

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId)
    }

    const { data: conflicts, error } = await query

    if (error) {
      throw new Error(`Failed to check for conflicts: ${error.message}`)
    }

    return (conflicts?.length || 0) > 0
  }
}

// Utility function to create booking service instance
export async function createBookingService(clerkUserId: string): Promise<BookingService> {
  // Get user from database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (error || !user) {
    throw new Error('User not found')
  }

  // Get integration tokens from database
  const { data: integrations } = await supabase
    .from('user_integrations')
    .select('provider, access_token, refresh_token')
    .eq('user_id', user.id)
    .eq('is_active', true)

  let googleAccessToken: string | undefined
  let googleRefreshToken: string | undefined

  integrations?.forEach((integration) => {
    if (integration.provider === 'google') {
      googleAccessToken = integration.access_token
      googleRefreshToken = integration.refresh_token
    }
    // Zoom now uses Server-to-Server OAuth, no user tokens needed
  })

  return new BookingService(user.id, googleAccessToken, googleRefreshToken)
}