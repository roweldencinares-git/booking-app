import { NextRequest, NextResponse } from 'next/server'
import { createCalendarService } from '@/lib/calendarService'

// Create calendar event
export async function POST(request: NextRequest) {
  try {
    const booking = await request.json()
    
    // Validate required fields
    const requiredFields = ['coachId', 'serviceId', 'clientEmail', 'clientName', 'startTime', 'endTime', 'title']
    for (const field of requiredFields) {
      if (!booking[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Convert date strings to Date objects
    booking.startTime = new Date(booking.startTime)
    booking.endTime = new Date(booking.endTime)

    const calendarService = await createCalendarService(booking.coachId)
    const eventId = await calendarService.createCalendarEvent(booking)

    return NextResponse.json({ eventId, success: true })

  } catch (error) {
    console.error('Calendar event creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}

// Update calendar event
export async function PUT(request: NextRequest) {
  try {
    const booking = await request.json()
    
    if (!booking.calendarEventId) {
      return NextResponse.json(
        { error: 'Missing calendarEventId for update' },
        { status: 400 }
      )
    }

    // Convert date strings to Date objects
    booking.startTime = new Date(booking.startTime)
    booking.endTime = new Date(booking.endTime)

    const calendarService = await createCalendarService(booking.coachId)
    const success = await calendarService.updateCalendarEvent(booking)

    return NextResponse.json({ success })

  } catch (error) {
    console.error('Calendar event update error:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    )
  }
}

// Delete calendar event
export async function DELETE(request: NextRequest) {
  try {
    const booking = await request.json()
    
    if (!booking.calendarEventId) {
      return NextResponse.json(
        { error: 'Missing calendarEventId for deletion' },
        { status: 400 }
      )
    }

    const calendarService = await createCalendarService(booking.coachId)
    const success = await calendarService.deleteCalendarEvent(booking)

    return NextResponse.json({ success })

  } catch (error) {
    console.error('Calendar event deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    )
  }
}