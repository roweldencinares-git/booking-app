/**
 * NEXUS-Powered Booking API
 *
 * This endpoint uses the NEXUS framework for:
 * - Auto-recovery from failures
 * - Performance monitoring
 * - Predictive analytics
 * - Self-healing operations
 * - Timezone-aware booking (respects coach's local timezone)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createBooking } from '../../../../lib/nexus/bookingNexus'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== NEXUS BOOKING API CALLED ===')
    const body = await request.json()

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

    // Validate required fields (basic validation before NEXUS)
    if (!serviceId || !userId || !date || !time || !duration || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get coach timezone for proper time handling
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: coach } = await supabase
      .from('users')
      .select('timezone')
      .eq('id', userId)
      .single()

    const timezone = coach?.timezone || 'America/Chicago'

    // Call NEXUS-wrapped booking service
    // NEXUS handles: validation, error recovery, monitoring, optimization
    const result = await createBooking({
      serviceId,
      userId,
      date,
      time,
      duration,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      timezone // Pass timezone to ensure correct time handling
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Booking creation failed',
          insights: result.insights,
          predictions: result.predictions
        },
        { status: 500 }
      )
    }

    // Return success with NEXUS insights
    return NextResponse.json({
      success: true,
      booking: result.data,
      // NEXUS telemetry (helps debug and improve system)
      nexus: {
        insights: result.insights,
        predictions: result.predictions,
        optimizations: result.optimizations,
        metrics: result.metrics
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[NEXUS Booking API] Unhandled error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}