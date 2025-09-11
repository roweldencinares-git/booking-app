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
    const { startTime, endTime } = body

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: startTime, endTime' },
        { status: 400 }
      )
    }

    // Validate ISO date formats
    try {
      new Date(startTime).toISOString()
      new Date(endTime).toISOString()
    } catch {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    // Validate that endTime is after startTime
    if (new Date(endTime) <= new Date(startTime)) {
      return NextResponse.json(
        { error: 'endTime must be after startTime' },
        { status: 400 }
      )
    }

    // Create booking service instance
    const bookingService = await createBookingService(userId)

    // Check availability
    const isAvailable = await bookingService.isTimeSlotAvailable(startTime, endTime)

    return NextResponse.json({
      success: true,
      available: isAvailable,
      startTime,
      endTime
    })

  } catch (error) {
    console.error('Availability check error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        success: true,
        available: false,
        reason: errorMessage
      }
    )
  }
}