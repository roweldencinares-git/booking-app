import { google } from 'googleapis'
import { GoogleCalendarService } from './google-calendar'
import { createClient } from '@supabase/supabase-js'

const calendar = google.calendar('v3')

// Helper function to create Supabase client
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface Booking {
  id?: string
  coachId: string
  serviceId: string
  clientEmail: string
  clientName: string
  startTime: Date
  endTime: Date
  title: string
  description?: string
  calendarEventId?: string
}

export interface AvailabilitySlot {
  start: Date
  end: Date
  available: boolean
}

export interface WorkingHours {
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  startTime: string // HH:mm format
  endTime: string
  isActive: boolean
}

export interface Coach {
  id: string
  email: string
  timezone: string
  calendarId?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiryDate?: Date
  workingHours?: WorkingHours[]
}

export interface Service {
  id: string
  name: string
  duration: number // in minutes
  bufferTime?: number // buffer time after appointment in minutes
}

export class CalendarService {
  private googleCalendarService: GoogleCalendarService | null = null

  constructor(private coach: Coach) {
    if (coach.accessToken && coach.refreshToken) {
      this.googleCalendarService = new GoogleCalendarService(
        coach.accessToken,
        coach.refreshToken,
        coach.id,
        coach.tokenExpiryDate
      )
    }
  }

  /**
   * Get available time slots for a coach on a specific date
   */
  async getAvailability(coachId: string, serviceId: string, date: Date): Promise<AvailabilitySlot[]> {
    try {
      // Get coach and service details
      const [coachData, serviceData] = await Promise.all([
        this.getCoachById(coachId),
        this.getServiceById(serviceId)
      ])

      if (!coachData || !serviceData) {
        throw new Error('Coach or service not found')
      }

      // Get coach's working hours for the specific day
      const dayOfWeek = date.getDay()
      const workingHours = coachData.workingHours?.find(
        wh => wh.dayOfWeek === dayOfWeek && wh.isActive
      )

      if (!workingHours) {
        return [] // No working hours set for this day
      }

      // Generate time slots based on working hours
      const timeSlots = this.generateTimeSlots(
        date,
        workingHours,
        serviceData.duration,
        serviceData.bufferTime || 0,
        coachData.timezone
      )

      // Get busy times from Google Calendar
      const busyTimes = await this.getBusyTimes(coachData, date)

      // Filter out busy slots
      const availableSlots = timeSlots.filter(slot => 
        !this.isSlotConflicting(slot, busyTimes)
      )

      return availableSlots

    } catch (error) {
      console.error('Error getting availability:', error)
      throw error
    }
  }

  /**
   * Create a calendar event for a booking
   */
  async createCalendarEvent(booking: Booking): Promise<string | null> {
    try {
      if (!this.googleCalendarService) {
        console.warn('Google Calendar not configured for coach')
        return null
      }

      const coach = await this.getCoachById(booking.coachId)
      if (!coach) {
        throw new Error('Coach not found')
      }

      const calendarEvent = {
        summary: booking.title,
        description: booking.description || `Appointment with ${booking.clientName}`,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: coach.timezone
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: coach.timezone
        },
        attendees: [
          {
            email: booking.clientEmail,
            displayName: booking.clientName
          },
          {
            email: coach.email,
            displayName: `${coach.first_name} ${coach.last_name}`
          }
        ]
      }

      const createdEvent = await this.googleCalendarService.createEvent(
        coach.calendarId || 'primary',
        calendarEvent
      )

      // Update booking with calendar event ID
      if (booking.id && createdEvent.id) {
        await this.updateBookingCalendarEventId(booking.id, createdEvent.id)
      }

      return createdEvent.id || null

    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw error
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateCalendarEvent(booking: Booking): Promise<boolean> {
    try {
      if (!this.googleCalendarService || !booking.calendarEventId) {
        console.warn('Google Calendar not configured or no event ID')
        return false
      }

      const coach = await this.getCoachById(booking.coachId)
      if (!coach) {
        throw new Error('Coach not found')
      }

      const calendarEvent = {
        summary: booking.title,
        description: booking.description || `Appointment with ${booking.clientName}`,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: coach.timezone
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: coach.timezone
        },
        attendees: [
          {
            email: booking.clientEmail,
            displayName: booking.clientName
          },
          {
            email: coach.email,
            displayName: `${coach.first_name} ${coach.last_name}`
          }
        ]
      }

      await this.googleCalendarService.updateEvent(
        coach.calendarId || 'primary',
        booking.calendarEventId,
        calendarEvent
      )

      return true

    } catch (error) {
      console.error('Error updating calendar event:', error)
      throw error
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(booking: Booking): Promise<boolean> {
    try {
      if (!this.googleCalendarService || !booking.calendarEventId) {
        console.warn('Google Calendar not configured or no event ID')
        return false
      }

      const coach = await this.getCoachById(booking.coachId)
      if (!coach) {
        throw new Error('Coach not found')
      }

      await this.googleCalendarService.deleteEvent(
        coach.calendarId || 'primary',
        booking.calendarEventId
      )

      // Clear calendar event ID from booking
      if (booking.id) {
        await this.updateBookingCalendarEventId(booking.id, null)
      }

      return true

    } catch (error) {
      console.error('Error deleting calendar event:', error)
      throw error
    }
  }

  // Private helper methods

  private async getCoachById(coachId: string): Promise<Coach | null> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          timezone,
          first_name,
          last_name,
          google_access_token,
          google_refresh_token,
          google_token_expires_at,
          working_hours
        `)
        .eq('id', coachId)
        .single()

      if (error || !data) {
        return null
      }

      return {
        id: data.id,
        email: data.email,
        timezone: data.timezone || 'America/Chicago', // Default to Central Time
        calendarId: 'primary', // Use primary calendar since we don't store calendar_id
        accessToken: data.google_access_token,
        refreshToken: data.google_refresh_token,
        tokenExpiryDate: data.google_token_expires_at ? new Date(data.google_token_expires_at) : undefined,
        workingHours: data.working_hours || this.getDefaultWorkingHours(),
        first_name: data.first_name,
        last_name: data.last_name
      }
    } catch (error) {
      console.error('Error fetching coach:', error)
      return null
    }
  }

  private async getServiceById(serviceId: string): Promise<Service | null> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('booking_types')
        .select('id, name, duration_minutes, buffer_time_minutes')
        .eq('id', serviceId)
        .single()

      if (error || !data) {
        return null
      }

      return {
        id: data.id,
        name: data.name,
        duration: data.duration_minutes,
        bufferTime: data.buffer_time_minutes
      }
    } catch (error) {
      console.error('Error fetching service:', error)
      return null
    }
  }

  private generateTimeSlots(
    date: Date,
    workingHours: WorkingHours,
    serviceDuration: number,
    bufferTime: number,
    timezone: string
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = []

    // Parse working hours
    const [startHour, startMinute] = workingHours.startTime.split(':').map(Number)
    const [endHour, endMinute] = workingHours.endTime.split(':').map(Number)

    // Create timezone-aware start and end times for the day
    // Use the date string in YYYY-MM-DD format
    const dateStr = date.toISOString().split('T')[0]

    // Create times in the coach's timezone
    const dayStart = this.createTimezoneAwareDate(dateStr, startHour, startMinute, timezone)
    const dayEnd = this.createTimezoneAwareDate(dateStr, endHour, endMinute, timezone)

    // Check if the selected date is today
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    // If it's today, ensure we don't show past time slots
    let effectiveStart = new Date(dayStart)
    if (isToday) {
      // Add 15 minutes buffer to current time to allow for booking preparation
      const currentTimeWithBuffer = new Date(now.getTime() + (15 * 60 * 1000))
      effectiveStart = currentTimeWithBuffer > dayStart ? currentTimeWithBuffer : dayStart
    }

    // Generate slots every 15 minutes (or service duration if shorter)
    const slotInterval = Math.min(15, serviceDuration)
    const totalSlotTime = serviceDuration + bufferTime

    let currentTime = new Date(effectiveStart)

    while (currentTime.getTime() + (totalSlotTime * 60 * 1000) <= dayEnd.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + (serviceDuration * 60 * 1000))

      slots.push({
        start: new Date(currentTime),
        end: slotEnd,
        available: true
      })

      currentTime = new Date(currentTime.getTime() + (slotInterval * 60 * 1000))
    }

    return slots
  }

  private async getBusyTimes(coach: Coach, date: Date): Promise<Array<{start: string, end: string}>> {
    if (!this.googleCalendarService) {
      return []
    }

    try {
      // Get busy times for the entire day
      const timeMin = new Date(date)
      timeMin.setHours(0, 0, 0, 0)
      
      const timeMax = new Date(date)
      timeMax.setHours(23, 59, 59, 999)

      return await this.googleCalendarService.getBusyTimes(
        coach.calendarId || 'primary',
        timeMin.toISOString(),
        timeMax.toISOString()
      )
    } catch (error) {
      console.error('Error getting busy times:', error)
      return []
    }
  }

  private isSlotConflicting(
    slot: AvailabilitySlot, 
    busyTimes: Array<{start: string, end: string}>
  ): boolean {
    return busyTimes.some(busyTime => {
      const busyStart = new Date(busyTime.start)
      const busyEnd = new Date(busyTime.end)
      
      // Check if slot overlaps with busy time
      return (
        (slot.start >= busyStart && slot.start < busyEnd) ||
        (slot.end > busyStart && slot.end <= busyEnd) ||
        (slot.start <= busyStart && slot.end >= busyEnd)
      )
    })
  }

  private async updateBookingCalendarEventId(bookingId: string, eventId: string | null): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      await supabase
        .from('bookings')
        .update({ calendar_event_id: eventId })
        .eq('id', bookingId)
    } catch (error) {
      console.error('Error updating booking calendar event ID:', error)
    }
  }

  private getDefaultWorkingHours(): WorkingHours[] {
    // Default 9 AM to 5 PM, Monday to Friday
    return [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true }, // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isActive: true }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isActive: true }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isActive: true }, // Friday
      { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', isActive: false }, // Saturday
      { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', isActive: false }  // Sunday
    ]
  }

  /**
   * Create a timezone-aware date from date string, time, and timezone
   * This ensures time slots are generated in the coach's local time
   */
  private createTimezoneAwareDate(
    dateStr: string,
    hour: number,
    minute: number,
    timezone: string
  ): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    const utcReference = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))

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
    const [datePart, timePart] = formatted.split(', ')
    const [fMonth, fDay, fYear] = datePart.split('/')
    const [fHour, fMinute, fSecond] = timePart.split(':')

    const tzHourDiff = parseInt(fHour) - hour
    const tzMinuteDiff = parseInt(fMinute) - minute

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
}

// Factory function to create CalendarService with coach data
export async function createCalendarService(coachId: string): Promise<CalendarService> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      timezone,
      first_name,
      last_name,
      google_access_token,
      google_refresh_token,
      google_token_expires_at,
      working_hours
    `)
    .eq('id', coachId)
    .single()

  if (error || !data) {
    throw new Error('Coach not found')
  }

  const coach: Coach = {
    id: data.id,
    email: data.email,
    timezone: data.timezone || 'America/Chicago', // Default to Central Time
    calendarId: 'primary', // Use primary calendar since we don't store calendar_id
    accessToken: data.google_access_token,
    refreshToken: data.google_refresh_token,
    tokenExpiryDate: data.google_token_expires_at ? new Date(data.google_token_expires_at) : undefined,
    workingHours: data.working_hours
  }

  return new CalendarService(coach)
}