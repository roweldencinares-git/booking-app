/**
 * Test booking creation with Wisconsin timezone
 * Verifies that bookings are created in coach's local time (Central Time)
 */

import { NextResponse } from 'next/server'
import { createBooking } from '@/lib/nexus/bookingNexus'

export async function POST() {
  try {
    // Test booking for Wisconsin coach
    // Coach timezone: America/Chicago (Central Time)
    // Test: Book for 2:00 PM Central Time tomorrow

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    console.log('\n🧪 === WISCONSIN TIMEZONE TEST ===')
    console.log('Testing booking for Wisconsin coach (America/Chicago - Central Time)')
    console.log('Booking time: 2:00 PM Central Time')
    console.log('Date:', tomorrowStr)

    const result = await createBooking({
      serviceId: 'b6c38628-8422-4310-a6e7-615775fe0115', // rowel1hour service
      userId: 'c238cd8f-a444-45ee-88e6-6c0e90b12d84', // Wisconsin coach
      date: tomorrowStr,
      time: '2:00 pm', // 2:00 PM Central Time
      duration: 60,
      customerName: 'Wisconsin Timezone Test',
      customerEmail: 'wisconsin-test@example.com',
      customerPhone: '+1-414-555-0100',
      notes: 'Testing that booking is created in America/Chicago (Central Time) for Wisconsin coach'
    })

    if (!result.success) {
      return NextResponse.json({
        test: 'FAILED',
        error: 'Booking creation failed',
        result
      }, { status: 500 })
    }

    // Verify timezone handling
    const booking = result.data
    const startTime = new Date(booking.start_time)

    // Convert to different timezones to verify
    const centralTime = startTime.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    })

    const easternTime = startTime.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    })

    const utcTime = startTime.toISOString()

    const verification = {
      requestedTime: '2:00 PM (Wisconsin/Central Time)',
      storedUTC: utcTime,
      displayCentral: centralTime,
      displayEastern: easternTime,
      isCorrect: centralTime.includes('2:00 PM') || centralTime.includes('02:00 PM')
    }

    console.log('\n✅ Booking Created:')
    console.log('- ID:', booking.id)
    console.log('- Client:', booking.client_name)
    console.log('- Requested Time:', '2:00 PM Central')
    console.log('- Stored UTC:', utcTime)
    console.log('- Display Central:', centralTime)
    console.log('- Display Eastern:', easternTime)
    console.log('- Timezone Correct?', verification.isCorrect ? '✅ YES' : '❌ NO')

    if (!verification.isCorrect) {
      console.warn('⚠️ WARNING: Booking time does not match requested Central Time!')
    }

    return NextResponse.json({
      test: 'SUCCESS',
      booking: {
        id: booking.id,
        client: booking.client_name,
        startTime: booking.start_time,
        endTime: booking.end_time,
        googleCalendarEvent: booking.google_calendar_event_id
      },
      verification,
      nexus: {
        insights: result.insights,
        metrics: result.metrics
      },
      message: verification.isCorrect
        ? '✅ Timezone handling is correct! Booking created at 2:00 PM Central Time.'
        : '❌ Timezone issue detected! Booking time does not match Wisconsin time.'
    })

  } catch (error: any) {
    console.error('❌ Wisconsin timezone test error:', error)
    return NextResponse.json({
      test: 'FAILED',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
