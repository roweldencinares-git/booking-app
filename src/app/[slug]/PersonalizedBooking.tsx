'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface PersonalizedBookingProps {
  service: {
    id: string
    name: string
    description?: string
    duration: number
    price?: number
    users: {
      id: string
      first_name: string
      last_name: string
      email: string
    }
  }
  slug: string
}

export default function PersonalizedBooking({ service, slug }: PersonalizedBookingProps) {
  // Common timezones
  const commonTimezones = [
    { value: 'America/Chicago', label: 'Central Time (Wisconsin)' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'America/Phoenix', label: 'Arizona' },
    { value: 'America/Anchorage', label: 'Alaska' },
    { value: 'Pacific/Honolulu', label: 'Hawaii' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Central Europe' },
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Asia/Kolkata', label: 'India' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Asia/Manila', label: 'Philippines' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' },
    { value: 'UTC', label: 'UTC' },
  ]

  const [selectedTimezone, setSelectedTimezone] = useState('America/Chicago') // Default to Wisconsin
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(service.duration || 60)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [step, setStep] = useState<'time' | 'info'>('time')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [timeSlots, setTimeSlots] = useState<{ value: string; display: string; localDisplay: string }[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [availableDays, setAvailableDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5])) // Default: Mon-Fri

  // Calendar comparison feature
  const [showCalendarCompare, setShowCalendarCompare] = useState(false)
  const [guestCalendarEvents, setGuestCalendarEvents] = useState<Array<{ start: string; end: string; summary: string }>>([])
  const [isLoadingGuestEvents, setIsLoadingGuestEvents] = useState(false)

  // Fetch coach's availability settings on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        console.log('[Booking] Fetching availability for user:', service.users.id)
        const response = await fetch(`/api/admin/check-availability?userId=${service.users.id}`)
        if (response.ok) {
          const data = await response.json()
          console.log('[Booking] Availability data:', data)
          // Extract which days are available (day_of_week where is_available = true)
          const availDays = new Set<number>()
          data.raw?.forEach((avail: any) => {
            if (avail.is_available) {
              availDays.add(avail.day_of_week)
            }
          })
          console.log('[Booking] Available days:', Array.from(availDays))
          setAvailableDays(availDays)
        } else {
          console.error('[Booking] Failed to fetch availability:', response.status)
        }
      } catch (error) {
        console.error('[Booking] Error fetching availability:', error)
      }
    }
    fetchAvailability()
  }, [service.users.id])

  // Fetch available time slots when date or duration changes
  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([])
      return
    }

    const fetchAvailableSlots = async () => {
      setIsLoadingSlots(true)
      try {
        const dateStr = selectedDate.toISOString().split('T')[0]
        const response = await fetch(
          `/api/booking/available-slots?userId=${service.users.id}&date=${dateStr}&duration=${selectedDuration}`
        )

        if (response.ok) {
          const data = await response.json()
          const formattedSlots = data.slots.map((time: string) => {
            const [hourStr, minuteStr] = time.split(':')
            const hour = parseInt(hourStr)
            const minute = parseInt(minuteStr)

            // Times from API are in coach's timezone (America/Chicago - Central Time)
            // The API returns "08:00" meaning 8:00 AM in Central Time
            // We need to construct the actual UTC moment for "08:00 Central Time on selectedDate"

            const year = selectedDate!.getFullYear()
            const month = String(selectedDate!.getMonth() + 1).padStart(2, '0')
            const day = String(selectedDate!.getDate()).padStart(2, '0')

            // Strategy: Create a date string, then use toLocaleString to interpret it correctly
            // Step 1: Create a dummy date string (interpreted in browser's local timezone)
            const localDateStr = `${year}-${month}-${day}T${hourStr.padStart(2, '0')}:${minuteStr}:00`
            const localDate = new Date(localDateStr)

            // Step 2: Get what time this date displays in Central Time
            const formatter = new Intl.DateTimeFormat('en-US', {
              timeZone: 'America/Chicago',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
            const centralStr = formatter.format(localDate) // e.g., "01/15/2025, 09:00:00" if browser is ahead

            // Step 3: Parse what we got vs what we want
            const [datePart, timePart] = centralStr.split(', ')
            const [centralMonth, centralDay, centralYear] = datePart.split('/')
            const [centralHourStr, centralMinStr, centralSecStr] = timePart.split(':')

            // What we want: hour:minute in Central Time on selectedDate
            // What we got: centralHourStr:centralMinStr in Central Time on selectedDate
            // Difference tells us the offset

            const wantedHour = parseInt(hourStr)
            const gotHour = parseInt(centralHourStr)
            const wantedMin = parseInt(minuteStr)
            const gotMin = parseInt(centralMinStr)

            // Calculate the difference in minutes
            const wantedTotalMinutes = wantedHour * 60 + wantedMin
            const gotTotalMinutes = gotHour * 60 + gotMin
            const diffMinutes = wantedTotalMinutes - gotTotalMinutes

            // Adjust the date by this difference
            const actualMoment = new Date(localDate.getTime() + diffMinutes * 60000)

            // Format for guest's timezone
            const guestFormatter = new Intl.DateTimeFormat('en-US', {
              timeZone: selectedTimezone,
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
            const displayTime = guestFormatter.format(actualMoment)

            // Format for coach's timezone (Central Time)
            const coachFormatter = new Intl.DateTimeFormat('en-US', {
              timeZone: 'America/Chicago',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
            const coachTime = coachFormatter.format(actualMoment) + ' CT'

            return { value: time, display: displayTime, localDisplay: coachTime }
          })
          setTimeSlots(formattedSlots)
        } else {
          setTimeSlots([])
        }
      } catch (error) {
        console.error('Error fetching available slots:', error)
        setTimeSlots([])
      } finally {
        setIsLoadingSlots(false)
      }
    }

    fetchAvailableSlots()
  }, [selectedDate, selectedDuration, selectedTimezone, service.users.id])

  // Calendar generation - create dates at noon to avoid timezone issues
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1, 12, 0, 0)
    const lastDay = new Date(year, month + 1, 0, 12, 0, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add days of month - create at noon to avoid timezone shifts
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day, 12, 0, 0))
    }
    return days
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleNextToInfo = () => {
    if (selectedDate && selectedTime) {
      setStep('info')
    }
  }

  // Check if a time slot conflicts with guest's calendar events
  const hasGuestConflict = (slotTime: string): boolean => {
    if (!showCalendarCompare || guestCalendarEvents.length === 0 || !selectedDate) {
      return false
    }

    // slotTime is in HH:mm format (24-hour) in coach's timezone (Central Time)
    // Convert to UTC timestamp for pure UTC comparison
    const [hour, minute] = slotTime.split(':').map(Number)

    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    // Create date in local browser timezone first
    const slotTimeInCoachTZ = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
    const slotDateInLocalTZ = new Date(slotTimeInCoachTZ)

    // Get the offset between browser's timezone and coach's timezone
    const coachTZFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    const coachTimeStr = coachTZFormatter.format(slotDateInLocalTZ)
    const [coachDatePart, coachTimePart] = coachTimeStr.split(', ')
    const [coachHourStr, coachMinStr] = coachTimePart.split(':')

    // Calculate the difference to adjust
    const wantedMinutes = hour * 60 + minute
    const gotMinutes = parseInt(coachHourStr) * 60 + parseInt(coachMinStr)
    const diffMinutes = wantedMinutes - gotMinutes

    // Adjust to get the correct UTC timestamp
    const slotStart = new Date(slotDateInLocalTZ.getTime() + diffMinutes * 60000)
    const slotEnd = new Date(slotStart.getTime() + selectedDuration * 60000)

    console.log(`[Conflict Check] Checking slot ${slotTime} (UTC: ${slotStart.toISOString()} - ${slotEnd.toISOString()})`)

    // Pure UTC comparison - check all events directly without timezone filtering
    // Calendar events are already in UTC/ISO format
    return guestCalendarEvents.some(event => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)

      // Simple UTC overlap check
      const hasConflict = (
        (slotStart >= eventStart && slotStart < eventEnd) ||
        (slotEnd > eventStart && slotEnd <= eventEnd) ||
        (slotStart <= eventStart && slotEnd >= eventEnd)
      )

      if (hasConflict) {
        console.log(`[Conflict Check] ✗ CONFLICT with: ${event.summary} (UTC: ${eventStart.toISOString()} - ${eventEnd.toISOString()})`)
      }

      return hasConflict
    })
  }

  // Fetch guest calendar events
  const fetchGuestCalendarEvents = async () => {
    if (!selectedDate) return

    setIsLoadingGuestEvents(true)
    try {
      // Get month range for selected date
      const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)

      const response = await fetch(
        `/api/calendar/guest-events?startDate=${monthStart.toISOString().split('T')[0]}&endDate=${monthEnd.toISOString().split('T')[0]}`
      )

      if (response.ok) {
        const data = await response.json()
        console.log(`[Calendar Events] Fetched ${data.events?.length || 0} events for month`)

        // Filter events for selected date only
        const selectedDateStr = selectedDate.toISOString().split('T')[0]
        const eventsOnSelectedDate = (data.events || []).filter((event: any) => {
          const eventDate = new Date(event.start).toISOString().split('T')[0]
          return eventDate === selectedDateStr
        })

        console.log(`[Calendar Events] ${eventsOnSelectedDate.length} events on ${selectedDateStr}:`)
        eventsOnSelectedDate.forEach((event: any) => {
          console.log(`  - ${event.summary}: ${event.start} to ${event.end}`)
        })

        setGuestCalendarEvents(data.events || [])
      } else {
        console.error('Failed to fetch guest calendar events')
        setGuestCalendarEvents([])
      }
    } catch (error) {
      console.error('Error fetching guest calendar events:', error)
      setGuestCalendarEvents([])
    } finally {
      setIsLoadingGuestEvents(false)
    }
  }

  // Check for calendar connection on mount and when returning from OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('calendar_connected') === 'true') {
      setShowCalendarCompare(true)
      fetchGuestCalendarEvents()
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Refetch events when date changes and calendar comparison is enabled
  useEffect(() => {
    if (showCalendarCompare && selectedDate) {
      fetchGuestCalendarEvents()
    }
  }, [showCalendarCompare, selectedDate])

  const handleCalendarCompare = () => {
    // Initiate Google OAuth for guest calendar access
    const currentPath = window.location.pathname
    window.location.href = `/api/auth/google/guest?returnUrl=${encodeURIComponent(currentPath)}`
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          userId: service.users.id,
          date: selectedDate.toISOString().split('T')[0],
          time: selectedTime,
          duration: selectedDuration,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          notes: customerInfo.notes,
        }),
      })

      if (response.ok) {
        setIsConfirmed(true)
      } else {
        alert('Booking failed. Please try again.')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Booking failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-3xl font-bold text-primary-teal mb-2">Booking Confirmed!</h2>
            <p className="text-accent-grey-600">
              You'll receive a confirmation email shortly with meeting details.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Steps */}
      <div className="border-b border-accent-grey-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${step === 'time' ? 'bg-primary-orange text-white' : 'bg-white border-2 border-accent-grey-300 text-accent-grey-500'}`}>
                1
              </div>
              <span className={`text-sm ${step === 'time' ? 'text-primary-teal font-medium' : 'text-accent-grey-500'}`}>CHOOSE TIME</span>
            </div>
            <div className="w-32 h-0.5 bg-accent-grey-300"></div>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${step === 'info' ? 'bg-primary-orange text-white' : 'bg-white border-2 border-accent-grey-300 text-accent-grey-500'}`}>
                2
              </div>
              <span className={`text-sm ${step === 'info' ? 'text-primary-teal font-medium' : 'text-accent-grey-500'}`}>YOUR INFO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spearity Logo */}
      <div className="text-center py-8">
        <div className="inline-block">
          <h1 className="text-4xl font-bold text-primary-teal mb-1">spearity</h1>
          <p className="text-sm text-primary-orange font-medium">business growth community</p>
        </div>
      </div>

      {step === 'time' && (
        <div className="max-w-6xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Calendar */}
            <div className="bg-primary-teal rounded-2xl p-8 text-white">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  <span className="text-4xl">👤</span>
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  Meet with {service.users.first_name} {service.users.last_name}
                </h2>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={previousMonth} className="text-white/80 hover:text-white">
                    ←
                  </button>
                  <h3 className="text-xl font-semibold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button onClick={nextMonth} className="text-white/80 hover:text-white">
                    →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-white/70 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    // Create today at noon for consistent comparison
                    const today = new Date()
                    today.setHours(12, 0, 0, 0)
                    const isPast = date && date < today
                    const dayOfWeek = date?.getDay()
                    const isUnavailable = date && !availableDays.has(dayOfWeek)
                    const isDisabled = !date || isPast || isUnavailable

                    return (
                      <button
                        key={index}
                        onClick={() => date && !isDisabled && handleDateSelect(date)}
                        disabled={isDisabled}
                        className={`
                          aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                          ${!date ? 'invisible' : ''}
                          ${isPast ? 'text-white/30 cursor-not-allowed' : ''}
                          ${isUnavailable ? 'text-white/30 cursor-not-allowed line-through' : ''}
                          ${selectedDate?.toDateString() === date?.toDateString() ? 'bg-white text-primary-teal' : 'hover:bg-white/20 text-white'}
                          ${isDisabled ? 'cursor-not-allowed' : ''}
                        `}
                      >
                        {date?.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right Side - Time & Duration Selection */}
            <div>
              {!service.duration && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-accent-grey-900 mb-4">How long do you need?</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedDuration(15)}
                      className={`py-3 px-4 rounded-lg border-2 transition-colors ${selectedDuration === 15 ? 'border-primary-blue bg-accent-light-blue text-primary-teal' : 'border-accent-grey-200 hover:border-primary-blue'}`}
                    >
                      15 mins
                    </button>
                    <button
                      onClick={() => setSelectedDuration(30)}
                      className={`py-3 px-4 rounded-lg border-2 transition-colors ${selectedDuration === 30 ? 'border-primary-blue bg-accent-light-blue text-primary-teal' : 'border-accent-grey-200 hover:border-primary-blue'}`}
                    >
                      30 mins
                    </button>
                    <button
                      onClick={() => setSelectedDuration(60)}
                      className={`py-3 px-4 rounded-lg border-2 transition-colors ${selectedDuration === 60 ? 'border-primary-blue bg-accent-light-blue text-primary-teal' : 'border-accent-grey-200 hover:border-primary-blue'}`}
                    >
                      1 hour
                    </button>
                  </div>
                </div>
              )}

              <div>
                {/* Calendar Comparison Option */}
                {!showCalendarCompare && (
                  <div className="mb-4 p-4 bg-accent-light-blue border border-primary-blue/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-accent-grey-900 mb-1">
                          Compare with your calendar
                        </h4>
                        <p className="text-xs text-accent-grey-600 mb-2">
                          Connect your Google Calendar to see your existing events and avoid conflicts
                        </p>
                        <button
                          onClick={handleCalendarCompare}
                          className="text-xs font-medium text-primary-blue hover:text-primary-teal transition-colors underline"
                        >
                          Connect Google Calendar →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showCalendarCompare && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">
                          Calendar comparison enabled
                        </p>
                        <p className="text-xs text-green-600 mt-0.5">
                          Times that conflict with your calendar are marked
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCalendarCompare(false)}
                        className="text-xs text-green-600 hover:text-green-800 underline"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-accent-grey-900 mb-2">
                    Select your timezone
                  </label>
                  <select
                    value={selectedTimezone}
                    onChange={(e) => setSelectedTimezone(e.target.value)}
                    className="w-full border border-accent-grey-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  >
                    {commonTimezones.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-accent-grey-900">What time works best?</h3>
                </div>
                {selectedDate && (
                  <div className="mb-4">
                    <p className="text-sm text-accent-grey-600">
                      Showing times for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        Your time ({commonTimezones.find(tz => tz.value === selectedTimezone)?.label || selectedTimezone}) shown on left, coach's time (CT) on right
                      </p>
                    </div>
                  </div>
                )}

                {!selectedDate && (
                  <div className="text-center py-8 text-accent-grey-500">
                    Please select a date first
                  </div>
                )}

                {selectedDate && isLoadingSlots && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue mx-auto"></div>
                    <p className="text-sm text-accent-grey-600 mt-2">Loading available times...</p>
                  </div>
                )}

                {selectedDate && !isLoadingSlots && timeSlots.length === 0 && (
                  <div className="text-center py-8 text-accent-grey-500">
                    No available times for this date. Please select another date.
                  </div>
                )}

                {selectedDate && !isLoadingSlots && timeSlots.length > 0 && (() => {
                  const availableSlots = timeSlots.filter(slot => !hasGuestConflict(slot.value))
                  console.log(`[Available Slots] ${timeSlots.length} total slots, ${availableSlots.length} available after filtering conflicts`)

                  return availableSlots.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot.value}
                          onClick={() => handleTimeSelect(slot.value)}
                          className={`w-full py-3 px-4 rounded-lg border transition-colors text-left ${
                            selectedTime === slot.value
                              ? 'border-primary-blue bg-accent-light-blue text-primary-teal font-medium'
                              : 'border-accent-grey-200 hover:border-primary-blue'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{slot.display}</span>
                            <span className="text-sm text-accent-grey-500">{slot.localDisplay}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null
                })()}

                {/* Show message if calendar comparison filtered out all slots */}
                {selectedDate && !isLoadingSlots && timeSlots.length > 0 && showCalendarCompare && timeSlots.filter(slot => !hasGuestConflict(slot.value)).length === 0 && (
                  <div className="text-center py-8 text-orange-600">
                    <p className="font-medium">All available times conflict with your calendar</p>
                    <p className="text-sm text-accent-grey-600 mt-2">Try selecting a different date or disconnecting calendar comparison</p>
                  </div>
                )}
              </div>

              {selectedDate && selectedTime && (
                <button
                  onClick={handleNextToInfo}
                  className="w-full mt-6 bg-primary-blue text-white py-4 rounded-lg hover:bg-primary-teal transition-colors font-medium"
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'info' && (
        <div className="max-w-2xl mx-auto px-4 pb-12">
          <div className="bg-accent-grey-50 border border-accent-grey-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-accent-grey-700">
              <strong>Selected:</strong> {selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {selectedTime} ({selectedDuration} minutes)
              <button onClick={() => setStep('time')} className="text-primary-blue hover:text-primary-teal ml-2">Change</button>
            </p>
          </div>

          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-accent-grey-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                className="w-full border border-accent-grey-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accent-grey-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                className="w-full border border-accent-grey-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accent-grey-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                className="w-full border border-accent-grey-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accent-grey-700 mb-2">
                Additional Notes
              </label>
              <textarea
                rows={4}
                value={customerInfo.notes}
                onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                placeholder="Anything you'd like to mention..."
                className="w-full border border-accent-grey-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('time')}
                className="flex-1 bg-accent-grey-200 text-accent-grey-700 py-3 px-4 rounded-lg hover:bg-accent-grey-300 transition-colors font-medium"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary-blue text-white py-3 px-4 rounded-lg hover:bg-primary-teal transition-colors disabled:opacity-50 font-medium"
              >
                {isSubmitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
