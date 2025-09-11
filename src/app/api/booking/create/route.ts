import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createBookingService, type CreateBookingInput } from '@/lib/bookingService'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CreateBookingInput = await request.json()

    // Validate required fields
    if (!body.bookingTypeId || !body.clientName || !body.clientEmail || !body.startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingTypeId, clientName, clientEmail, startTime' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.clientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate ISO date format
    try {
      new Date(body.startTime).toISOString()
    } catch {
      return NextResponse.json(
        { error: 'Invalid startTime format. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    // Create booking service instance
    const bookingService = await createBookingService(userId)

    // Create the booking
    const result = await bookingService.createBooking(body)

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Booking creation error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Handle specific error types
    if (errorMessage.includes('Time slot is already booked') || 
        errorMessage.includes('outside available hours') ||
        errorMessage.includes('in the past')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 } // Conflict
      )
    }

    if (errorMessage.includes('not found') || errorMessage.includes('inactive')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}