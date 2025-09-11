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