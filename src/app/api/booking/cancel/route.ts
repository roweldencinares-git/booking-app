import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createBookingService } from '@/lib/bookingService'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing required field: bookingId' },
        { status: 400 }
      )
    }

    // Create booking service instance
    const bookingService = await createBookingService(userId)

    // Cancel the booking
    const success = await bookingService.cancelBooking(bookingId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully'
    })

  } catch (error) {
    console.error('Booking cancellation error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Handle specific error types
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    }

    if (errorMessage.includes('already cancelled')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 } // Conflict
      )
    }

    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}