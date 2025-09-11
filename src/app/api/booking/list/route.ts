import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createBookingService } from '@/lib/bookingService'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'confirmed' | 'cancelled' | 'completed' | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    // Validate status if provided
    if (status && !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: confirmed, cancelled, completed' },
        { status: 400 }
      )
    }

    // Validate date formats if provided
    if (startDate) {
      try {
        new Date(startDate).toISOString()
      } catch {
        return NextResponse.json(
          { error: 'Invalid startDate format. Use ISO 8601 format.' },
          { status: 400 }
        )
      }
    }

    if (endDate) {
      try {
        new Date(endDate).toISOString()
      } catch {
        return NextResponse.json(
          { error: 'Invalid endDate format. Use ISO 8601 format.' },
          { status: 400 }
        )
      }
    }

    // Validate limit if provided
    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
      return NextResponse.json(
        { error: 'Invalid limit. Must be a number between 1 and 100.' },
        { status: 400 }
      )
    }

    // Create booking service instance
    const bookingService = await createBookingService(userId)

    // Get bookings with filters
    const bookings = await bookingService.listBookings({
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: limit || undefined
    })

    return NextResponse.json({
      success: true,
      data: bookings,
      count: bookings.length
    })

  } catch (error) {
    console.error('Booking list error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}