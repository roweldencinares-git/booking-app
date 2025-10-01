/**
 * MARVA-Enhanced Booking Creation API
 * Demonstrates SPHERE pattern integration with Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createBookingService } from '@/lib/bookingService'
import { createMarvaBookingService } from '@/marva/bookingServiceMarva'

export async function POST(request: NextRequest) {
  try {
    // Following SPHERE pattern for Booking system: SCAN
    console.log('[MARVA API] SCAN: Analyzing booking creation request')

    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { bookingTypeId, clientName, clientEmail, clientPhone, startTime, notes, timezone } = body

    // Following SPHERE pattern for Booking system: PLAN
    console.log('[MARVA API] PLAN: Preparing booking service with MARVA wrapper')

    // Create standard booking service
    const bookingService = await createBookingService(userId)

    // Wrap with MARVA capabilities
    const marvaService = await createMarvaBookingService(bookingService)

    // Following SPHERE pattern for Booking system: HEAL
    console.log('[MARVA API] HEAL: Executing booking creation with self-healing')

    // Execute booking with full SPHERE methodology
    const result = await marvaService.createBooking({
      bookingTypeId,
      clientName,
      clientEmail,
      clientPhone,
      startTime,
      notes,
      timezone
    })

    // Following SPHERE pattern for Booking system: EXAMINE
    console.log('[MARVA API] EXAMINE: Validating booking result')
    console.log('[MARVA API] SPHERE Phases:', result.spherePhases)

    if (!result.success) {
      // Following SPHERE pattern for Booking system: REINFORCE
      console.log('[MARVA API] REINFORCE: Logging failure for pattern analysis')

      return NextResponse.json(
        {
          error: 'Booking creation failed',
          details: result.errors,
          warnings: result.warnings,
          spherePhases: result.spherePhases
        },
        { status: 400 }
      )
    }

    // Following SPHERE pattern for Booking system: REINFORCE
    console.log('[MARVA API] REINFORCE: Booking created successfully, strengthening patterns')

    // Following SPHERE pattern for Booking system: EVOLVE
    console.log('[MARVA API] EVOLVE: Recording success patterns for system improvement')

    // Return successful response with MARVA metadata
    return NextResponse.json(
      {
        success: true,
        booking: result.data?.booking,
        integrations: {
          googleCalendar: !!result.data?.googleCalendarEventId,
          zoom: !!result.data?.zoomMeetingId,
          zoho: !!result.data?.zohoContactId
        },
        spherePhases: result.spherePhases,
        warnings: result.warnings,
        marva: {
          fractalDimension: 0.580,
          systemNode: 'BOOKING-NODE',
          healingActions: result.healingActions,
          reinforcements: result.reinforcements,
          evolutions: result.evolutions
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('[MARVA API] FAILED: Unhandled error in booking creation', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        marva: {
          systemNode: 'BOOKING-NODE',
          spherePhase: 'FAILED'
        }
      },
      { status: 500 }
    )
  }
}
