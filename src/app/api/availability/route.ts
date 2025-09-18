import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleCalendarService } from '../../../lib/google-calendar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration') || '30')

    if (!userId || !date) {
      return NextResponse.json({ error: 'Missing userId or date' }, { status: 400 })
    }

    // Get user's Google Calendar integration
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .single()

    if (!integration) {
      // Return default time slots if no Google Calendar integration
      const defaultSlots = generateDefaultTimeSlots()
      return NextResponse.json({ available_times: defaultSlots })
    }

    // Use Google Calendar to get real availability
    const calendarService = new GoogleCalendarService(
      integration.access_token,
      integration.refresh_token
    )

    const startOfDay = new Date(date + 'T00:00:00')
    const endOfDay = new Date(date + 'T23:59:59')

    // Get busy times for the day
    const busyTimes = await calendarService.getBusyTimes(
      'primary',
      startOfDay.toISOString(),
      endOfDay.toISOString()
    )

    // Generate available slots based on busy times
    const availableSlots = generateAvailableSlots(date, duration, busyTimes)

    return NextResponse.json({ available_times: availableSlots })
  } catch (error) {
    console.error('Error fetching availability:', error)

    // Fallback to default slots on error
    const defaultSlots = generateDefaultTimeSlots()
    return NextResponse.json({ available_times: defaultSlots })
  }
}

function generateDefaultTimeSlots(): string[] {
  return [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ]
}

function generateAvailableSlots(date: string, duration: number, busyTimes: any[]): string[] {
  const slots: string[] = []
  const workingHours = {
    start: 9, // 9 AM
    end: 17,  // 5 PM
    slotInterval: 30 // 30 minutes
  }

  // Convert busy times to easier format
  const busyPeriods = busyTimes.map(busy => ({
    start: new Date(busy.start),
    end: new Date(busy.end)
  }))

  // Generate slots for the day
  const currentDate = new Date(date)

  for (let hour = workingHours.start; hour < workingHours.end; hour++) {
    for (let minute = 0; minute < 60; minute += workingHours.slotInterval) {
      const slotStart = new Date(currentDate)
      slotStart.setHours(hour, minute, 0, 0)

      const slotEnd = new Date(slotStart)
      slotEnd.setMinutes(slotEnd.getMinutes() + duration)

      // Check if this slot conflicts with any busy time
      const isAvailable = !busyPeriods.some(busy =>
        (slotStart >= busy.start && slotStart < busy.end) ||
        (slotEnd > busy.start && slotEnd <= busy.end) ||
        (slotStart <= busy.start && slotEnd >= busy.end)
      )

      if (isAvailable) {
        const timeString = slotStart.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        slots.push(timeString)
      }
    }
  }

  return slots
}