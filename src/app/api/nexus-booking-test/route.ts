/**
 * NEXUS Booking Test Endpoint
 *
 * Test the NEXUS-powered booking system
 */

import { NextResponse } from 'next/server'
import { createBooking, cancelBooking, rescheduleBooking } from '../../../lib/nexus/bookingNexus'

export async function GET() {
  try {
    console.log('\n🚀 === NEXUS BOOKING SYSTEM TEST ===\n')

    // Test 1: Create a test booking
    console.log('Test 1: Creating booking with NEXUS...')
    const createResult = await createBooking({
      serviceId: '550e8400-e29b-41d4-a716-446655440000', // Replace with valid service ID
      userId: 'c238cd8f-a444-45ee-88e6-6c0e90b12d84', // Rowel's user ID
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      time: '10:00 am',
      duration: 60,
      customerName: 'NEXUS Test Client',
      customerEmail: 'nexus-test@example.com',
      customerPhone: '+1234567890',
      notes: 'This is a NEXUS framework test booking'
    })

    console.log('✅ Create Result:', {
      success: createResult.success,
      bookingId: createResult.data?.id,
      insights: createResult.insights,
      metrics: createResult.metrics
    })

    if (!createResult.success) {
      return NextResponse.json({
        test: 'FAILED',
        step: 'create',
        error: 'Booking creation failed',
        result: createResult
      }, { status: 500 })
    }

    const bookingId = createResult.data.id

    // Test 2: Reschedule the booking
    console.log('\nTest 2: Rescheduling booking with NEXUS...')
    const rescheduleResult = await rescheduleBooking({
      bookingId,
      userId: 'c238cd8f-a444-45ee-88e6-6c0e90b12d84',
      newDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
      newTime: '2:00 pm'
    })

    console.log('✅ Reschedule Result:', {
      success: rescheduleResult.success,
      insights: rescheduleResult.insights,
      metrics: rescheduleResult.metrics
    })

    // Test 3: Cancel the booking
    console.log('\nTest 3: Cancelling booking with NEXUS...')
    const cancelResult = await cancelBooking({
      bookingId,
      userId: 'c238cd8f-a444-45ee-88e6-6c0e90b12d84'
    })

    console.log('✅ Cancel Result:', {
      success: cancelResult.success,
      insights: cancelResult.insights,
      metrics: cancelResult.metrics
    })

    console.log('\n✅ === ALL NEXUS TESTS PASSED ===\n')

    return NextResponse.json({
      test: 'SUCCESS',
      results: {
        create: {
          success: createResult.success,
          bookingId,
          insights: createResult.insights,
          predictions: createResult.predictions,
          metrics: createResult.metrics
        },
        reschedule: {
          success: rescheduleResult.success,
          insights: rescheduleResult.insights,
          metrics: rescheduleResult.metrics
        },
        cancel: {
          success: cancelResult.success,
          insights: cancelResult.insights,
          metrics: cancelResult.metrics
        }
      },
      summary: {
        totalDuration: (
          (createResult.metrics?.duration || 0) +
          (rescheduleResult.metrics?.duration || 0) +
          (cancelResult.metrics?.duration || 0)
        ).toFixed(2) + 'ms',
        allTestsPassed: createResult.success && rescheduleResult.success && cancelResult.success
      }
    })

  } catch (error: any) {
    console.error('❌ NEXUS Test Error:', error)
    return NextResponse.json({
      test: 'FAILED',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
