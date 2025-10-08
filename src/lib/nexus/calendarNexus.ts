/**
 * NEXUS-Powered Calendar Service
 *
 * Google Calendar operations with 9-layer autonomous execution
 */

import { nexusify } from './core'
import { GoogleCalendarService, CalendarEvent } from '../google-calendar'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

interface CreateEventInput {
  userId: string
  calendarId?: string
  event: CalendarEvent
}

interface UpdateEventInput {
  userId: string
  calendarId?: string
  eventId: string
  event: CalendarEvent
}

interface DeleteEventInput {
  userId: string
  calendarId?: string
  eventId: string
}

interface GetAvailabilityInput {
  userId: string
  calendarId?: string
  timeMin: string
  timeMax: string
}

// ============================================================================
// HELPER: Get Calendar Service for User
// ============================================================================

async function getCalendarServiceForUser(userId: string): Promise<GoogleCalendarService> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: user, error } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expires_at, google_calendar_connected')
    .eq('id', userId)
    .single()

  if (error || !user) {
    throw new Error('User not found')
  }

  if (!user.google_calendar_connected || !user.google_access_token) {
    throw new Error('Google Calendar not connected for this user')
  }

  return new GoogleCalendarService(
    user.google_access_token,
    user.google_refresh_token,
    userId,
    user.google_token_expires_at ? new Date(user.google_token_expires_at) : undefined
  )
}

// ============================================================================
// CORE CALENDAR OPERATIONS
// ============================================================================

async function createEventCore(input: CreateEventInput) {
  const calendarService = await getCalendarServiceForUser(input.userId)
  const result = await calendarService.createEvent(input.calendarId || 'primary', input.event)
  return result
}

async function updateEventCore(input: UpdateEventInput) {
  const calendarService = await getCalendarServiceForUser(input.userId)
  const result = await calendarService.updateEvent(
    input.calendarId || 'primary',
    input.eventId,
    input.event
  )
  return result
}

async function deleteEventCore(input: DeleteEventInput) {
  const calendarService = await getCalendarServiceForUser(input.userId)
  await calendarService.deleteEvent(input.calendarId || 'primary', input.eventId)
  return { success: true, eventId: input.eventId }
}

async function getAvailabilityCore(input: GetAvailabilityInput) {
  const calendarService = await getCalendarServiceForUser(input.userId)
  const busyTimes = await calendarService.getBusyTimes(
    input.calendarId || 'primary',
    input.timeMin,
    input.timeMax
  )
  return { busyTimes }
}

async function listEventsCore(params: {
  userId: string
  calendarId?: string
  timeMin?: string
  timeMax?: string
  maxResults?: number
}) {
  const calendarService = await getCalendarServiceForUser(params.userId)
  const events = await calendarService.listEvents(
    params.calendarId || 'primary',
    params.timeMin,
    params.timeMax,
    params.maxResults
  )
  return { events }
}

async function getCalendarsCore(params: { userId: string }) {
  const calendarService = await getCalendarServiceForUser(params.userId)
  const calendars = await calendarService.getCalendars()
  return { calendars }
}

// ============================================================================
// NEXUS-WRAPPED OPERATIONS
// ============================================================================

/**
 * Create a Google Calendar event with NEXUS protection
 *
 * Features:
 * - Auto-retry on temporary failures
 * - Token refresh handling
 * - Fallback to local storage if Google fails
 * - Performance monitoring
 */
export const createCalendarEvent = nexusify(createEventCore, {
  service: 'calendar-create-event',
  mode: 'STANDARD'
})

/**
 * Update a Google Calendar event with NEXUS protection
 */
export const updateCalendarEvent = nexusify(updateEventCore, {
  service: 'calendar-update-event',
  mode: 'STANDARD'
})

/**
 * Delete a Google Calendar event with NEXUS protection
 */
export const deleteCalendarEvent = nexusify(deleteEventCore, {
  service: 'calendar-delete-event',
  mode: 'STANDARD'
})

/**
 * Get calendar availability (busy times) with NEXUS protection
 */
export const getCalendarAvailability = nexusify(getAvailabilityCore, {
  service: 'calendar-availability',
  mode: 'STANDARD'
})

/**
 * List calendar events with NEXUS protection
 */
export const listCalendarEvents = nexusify(listEventsCore, {
  service: 'calendar-list-events',
  mode: 'LITE' // Read operations can use lighter framework
})

/**
 * Get user's calendar list with NEXUS protection
 */
export const getUserCalendars = nexusify(getCalendarsCore, {
  service: 'calendar-list-calendars',
  mode: 'LITE'
})
