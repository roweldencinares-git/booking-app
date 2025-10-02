import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createBookingService, type RescheduleBookingInput } from '@/lib/bookingService'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingId, ...rescheduleData }: { bookingId: string } & RescheduleBookingInput = body

    if (!bookingId || !rescheduleData.newStartTime) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, newStartTime' },
        { status: 400 }
      )
    }

    // Validate ISO date format
    try {
      new Date(rescheduleData.newStartTime).toISOString()
    } catch {
      return NextResponse.json(
        { error: 'Invalid newStartTime format. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    // Create booking service instance
    const bookingService = await createBookingService(userId)

    // Reschedule the booking
    const result = await bookingService.rescheduleBooking(bookingId, rescheduleData)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Booking reschedule error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Handle specific error types
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    }

    if (errorMessage.includes('Time slot is already booked') || 
        errorMessage.includes('outside available hours') ||
        errorMessage.includes('in the past') ||
        errorMessage.includes('Cannot reschedule a cancelled booking')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 } // Conflict
      )
    }

    return NextResponse.json(
      { error: 'Failed to reschedule booking' },
      { status: 500 }
    )
  }
}