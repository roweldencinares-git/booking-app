import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createBookingService } from '@/lib/bookingService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: bookingId } = params

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking ID' },
        { status: 400 }
      )
    }

    // Create booking service instance
    const bookingService = await createBookingService(userId)

    // Get the booking
    const booking = await bookingService.getBooking(bookingId)

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: booking
    })

  } catch (error) {
    console.error('Booking fetch error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: bookingId } = params

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking ID' },
        { status: 400 }
      )
    }

    // Create booking service instance
    const bookingService = await createBookingService(userId)

    // Cancel the booking (same as cancel endpoint but via DELETE method)
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
    console.error('Booking deletion error:', error)
    
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