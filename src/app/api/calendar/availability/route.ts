import { NextRequest, NextResponse } from 'next/server'
import { createCalendarService } from '@/lib/calendarService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const coachId = searchParams.get('coachId')
    const serviceId = searchParams.get('serviceId')
    const date = searchParams.get('date')

    if (!coachId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: coachId, serviceId, date' },
        { status: 400 }
      )
    }

    const calendarService = await createCalendarService(coachId)
    const availability = await calendarService.getAvailability(
      coachId,
      serviceId,
      new Date(date)
    )

    return NextResponse.json({ availability })

  } catch (error) {
    console.error('Calendar availability error:', error)
    return NextResponse.json(
      { error: 'Failed to get availability' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, duration, serviceId } = await request.json()

    if (!date || !duration || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: date, duration, serviceId' },
        { status: 400 }
      )
    }

    // For now, use demo coach ID. In real app, get from service or auth
    const coachId = '1'

    const calendarService = await createCalendarService(coachId)
    const availability = await calendarService.getAvailability(
      coachId,
      serviceId,
      new Date(date)
    )

    // Format the availability data to match expected format
    const availableSlots = availability.map((slot: any) => {
      return new Date(slot.time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Singapore'
      })
    })

    return NextResponse.json({
      success: true,
      availableSlots: availableSlots.slice(0, 10) // Limit to 10 slots
    })

  } catch (error) {
    console.error('Calendar availability error:', error)

    // Return fallback slots if calendar service fails
    return NextResponse.json({
      success: false,
      availableSlots: ['4:15 AM', '4:30 AM', '4:45 AM', '5:00 AM', '5:15 AM', '5:30 AM'],
      message: 'Using fallback availability'
    })
  }
}