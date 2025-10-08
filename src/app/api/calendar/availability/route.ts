import { NextRequest, NextResponse } from 'next/server'
import { createCalendarService } from '@/lib/calendarService'
import { createClient } from '@supabase/supabase-js'

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

    // Get coach timezone
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: coach } = await supabase
      .from('users')
      .select('timezone')
      .eq('id', coachId)
      .single()

    const coachTimezone = coach?.timezone || 'America/Chicago'

    // Format the availability data to match expected format
    const availableSlots = availability.map((slot: any) => {
      return new Date(slot.time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: coachTimezone // Use coach's actual timezone
      })
    })

    return NextResponse.json({
      success: true,
      availableSlots: availableSlots.slice(0, 10) // Limit to 10 slots
    })

  } catch (error) {
    console.error('Calendar availability error:', error)

    // Return fallback slots if calendar service fails (Wisconsin business hours)
    return NextResponse.json({
      success: false,
      availableSlots: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
      message: 'Using fallback availability (calendar service unavailable)'
    })
  }
}