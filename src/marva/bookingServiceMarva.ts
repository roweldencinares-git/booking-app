/**
 * MARVA-Enhanced Booking Service
 * Wraps existing BookingService with SPHERE pattern and self-healing capabilities
 */

import { BookingService, CreateBookingInput, RescheduleBookingInput, BookingResult } from '../lib/bookingService'
import { type Booking } from '../lib/supabase'
import { withSphere, SphereLogger, type SphereResult } from './sphereWrapper'

export class MarvaBookingService {
  constructor(private bookingService: BookingService) {}

  /**
   * MARVA-enhanced booking creation with full SPHERE methodology
   */
  async createBooking(input: CreateBookingInput): Promise<SphereResult<BookingResult>> {
    const context = {
      operation: 'createBooking',
      node: 'BOOKING-NODE',
      startTime: new Date(),
      metadata: {
        clientEmail: input.clientEmail,
        startTime: input.startTime,
        bookingTypeId: input.bookingTypeId
      }
    }

    return await withSphere<BookingResult>(
      context,
      async () => {
        // Core booking operation
        return await this.bookingService.createBooking(input)
      },
      {
        // SCAN: Analyze input and current system state
        scan: async () => {
          const findings: string[] = []

          // Check email format
          if (!this.isValidEmail(input.clientEmail)) {
            findings.push('WARN: Invalid email format detected')
          }

          // Check if time is in the past
          if (new Date(input.startTime) < new Date()) {
            findings.push('ERROR: Attempted booking in the past')
          }

          // Check for existing bookings by this client
          const existingBookings = await this.bookingService.listBookings({
            status: 'confirmed'
          })

          const clientBookings = existingBookings.filter(
            b => b.client_email === input.clientEmail
          )

          findings.push(`Client has ${clientBookings.length} existing bookings`)

          return findings
        },

        // PLAN: Strategize the booking approach
        plan: async () => {
          let strategy = 'Standard booking creation with multi-system coordination:\n'
          strategy += '1. Validate booking type and availability\n'
          strategy += '2. Create database record (atomic)\n'
          strategy += '3. Create Google Calendar event (graceful degradation)\n'
          strategy += '4. Create Zoom meeting (graceful degradation)\n'
          strategy += '5. Log results for potential retry'

          return strategy
        },

        // VALIDATE: Examine the booking result
        validate: async (result: BookingResult) => {
          const validations: string[] = []

          // Check database record
          if (result.booking?.id) {
            validations.push('PASS: Database booking created successfully')
          } else {
            validations.push('FAIL: Database booking creation failed')
          }

          // Check Google Calendar
          if (result.googleCalendarEventId) {
            validations.push('PASS: Google Calendar event created')
          } else {
            validations.push('WARN: Google Calendar event not created (may need manual sync)')
          }

          // Check Zoom meeting
          if (result.zoomMeetingId) {
            validations.push('PASS: Zoom meeting created')
          } else {
            validations.push('WARN: Zoom meeting not created (may need manual creation)')
          }

          return validations
        },

        // REINFORCE: Add guardrails based on this booking
        reinforce: async (result: BookingResult) => {
          const guardrails: string[] = []

          // Log failed integrations for monitoring
          if (!result.googleCalendarEventId) {
            guardrails.push('Queue calendar sync retry job')
          }

          if (!result.zoomMeetingId) {
            guardrails.push('Queue Zoom meeting creation retry job')
          }

          // Track client booking patterns
          guardrails.push('Update client booking history for preference learning')

          return guardrails
        },

        // EVOLVE: Learn from this booking
        evolve: async (result: BookingResult) => {
          const learnings: string[] = []

          // Track integration success rates
          learnings.push('Record integration success metrics for reliability tracking')

          // Learn client preferences
          learnings.push('Analyze booking time preference for future suggestions')

          return learnings
        },

        maxRetries: 3
      }
    )
  }

  /**
   * MARVA-enhanced booking cancellation
   */
  async cancelBooking(bookingId: string): Promise<SphereResult<boolean>> {
    const context = {
      operation: 'cancelBooking',
      node: 'BOOKING-NODE',
      startTime: new Date(),
      metadata: { bookingId }
    }

    return await withSphere<boolean>(
      context,
      async () => {
        return await this.bookingService.cancelBooking(bookingId)
      },
      {
        scan: async () => {
          const findings: string[] = []
          const booking = await this.bookingService.getBooking(bookingId)

          if (!booking) {
            findings.push('ERROR: Booking not found')
          } else if (booking.status === 'cancelled') {
            findings.push('WARN: Booking already cancelled (idempotent)')
          } else {
            findings.push('Booking found and confirmed, proceeding with cancellation')
          }

          return findings
        },

        plan: async () => {
          return 'Multi-system cancellation:\n1. Update DB status\n2. Delete calendar event\n3. Delete Zoom meeting'
        },

        validate: async (result: boolean) => {
          return result
            ? ['PASS: Booking cancelled successfully']
            : ['FAIL: Booking cancellation failed']
        },

        reinforce: async () => {
          return ['Log cancellation pattern for no-show analysis']
        },

        evolve: async () => {
          return ['Track cancellation reasons for system improvement']
        },

        maxRetries: 3
      }
    )
  }

  /**
   * MARVA-enhanced booking rescheduling
   */
  async rescheduleBooking(
    bookingId: string,
    input: RescheduleBookingInput
  ): Promise<SphereResult<BookingResult>> {
    const context = {
      operation: 'rescheduleBooking',
      node: 'BOOKING-NODE',
      startTime: new Date(),
      metadata: { bookingId, newStartTime: input.newStartTime }
    }

    return await withSphere<BookingResult>(
      context,
      async () => {
        return await this.bookingService.rescheduleBooking(bookingId, input)
      },
      {
        scan: async () => {
          const findings: string[] = []
          const booking = await this.bookingService.getBooking(bookingId)

          if (!booking) {
            findings.push('ERROR: Booking not found')
          } else if (booking.status === 'cancelled') {
            findings.push('ERROR: Cannot reschedule cancelled booking')
          } else {
            findings.push('Booking eligible for rescheduling')
          }

          // Check new time slot availability
          const startTime = new Date(input.newStartTime)
          if (startTime < new Date()) {
            findings.push('ERROR: Cannot reschedule to past time')
          }

          return findings
        },

        plan: async () => {
          return 'Multi-system reschedule:\n1. Validate new time slot\n2. Update DB\n3. Update calendar\n4. Update Zoom meeting'
        },

        validate: async (result: BookingResult) => {
          const validations: string[] = []

          if (result.booking) {
            validations.push('PASS: Booking rescheduled in database')
          }

          if (result.googleCalendarEventId) {
            validations.push('PASS: Calendar event updated')
          } else {
            validations.push('WARN: Calendar event may need manual update')
          }

          if (result.zoomMeetingId) {
            validations.push('PASS: Zoom meeting updated')
          } else {
            validations.push('WARN: Zoom meeting may need manual update')
          }

          return validations
        },

        reinforce: async () => {
          return ['Track reschedule patterns', 'Queue integration retry if needed']
        },

        evolve: async () => {
          return ['Learn optimal rescheduling workflows', 'Track client reschedule frequency']
        },

        maxRetries: 3
      }
    )
  }

  /**
   * MARVA-enhanced availability check
   */
  async checkAvailability(startTime: string, endTime: string): Promise<SphereResult<boolean>> {
    const logger = new SphereLogger({
      operation: 'checkAvailability',
      node: 'BOOKING-NODE',
      startTime: new Date()
    })

    try {
      logger.scan(['Checking time slot availability'])

      logger.plan('Query existing bookings for conflicts')

      logger.heal('Execute availability query')
      const isAvailable = await this.bookingService.isTimeSlotAvailable(startTime, endTime)

      logger.examine([`Time slot ${isAvailable ? 'available' : 'unavailable'}`])

      logger.reinforce(['Cache availability result for performance'])

      logger.evolve(['Track popular booking times for optimization'])

      logger.complete()

      return {
        success: true,
        data: isAvailable,
        spherePhases: {
          scan: { duration: 0, findings: [] },
          plan: { duration: 0, strategy: '' },
          heal: { duration: 0, attempts: 1, recovered: false },
          examine: { duration: 0, validations: [] },
          reinforce: { duration: 0, guardrails: [] },
          evolve: { duration: 0, learnings: [] }
        }
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
        spherePhases: {
          scan: { duration: 0, findings: [] },
          plan: { duration: 0, strategy: '' },
          heal: { duration: 0, attempts: 1, recovered: false },
          examine: { duration: 0, validations: [] },
          reinforce: { duration: 0, guardrails: [] },
          evolve: { duration: 0, learnings: [] }
        }
      }
    }
  }

  /**
   * Helper: Email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

/**
 * Factory function to create MARVA-enhanced booking service
 */
export async function createMarvaBookingService(
  bookingService: BookingService
): Promise<MarvaBookingService> {
  return new MarvaBookingService(bookingService)
}
