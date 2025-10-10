'use client'

import { useState, useEffect } from 'react'

interface DateTimePickerProps {
  onDateTimeSelect: (date: Date, time: string, duration: number, timezone?: string) => void
  serviceId: string
  defaultDuration: number
  serviceName?: string
  coachTimezone?: string
}

export default function DateTimePicker({
  onDateTimeSelect,
  serviceId,
  defaultDuration,
  serviceName,
  coachTimezone
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [duration, setDuration] = useState<number>(defaultDuration)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [clientTimezone, setClientTimezone] = useState<string>('')

  // Detect client's timezone on mount
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setClientTimezone(detectedTimezone)
  }, [])

  // Determine available duration options based on service configuration
  const getAvailableDurations = () => {
    // Standard duration options (removed 1.5h, 2h, etc.)
    const standardDurations = [15, 30, 60] // 15 mins, 30 mins, 1 hour

    // Check if this is a service with flexible duration (no specific duration set or duration = 0)
    if (!defaultDuration || defaultDuration === 0) {
      // Default flexible options for new users or flexible services
      return standardDurations
    }

    // Check if this is a general service (like "rowel" without specific duration)
    // You can detect this by service name or add a "flexible" flag to services
    if (serviceName && !serviceName.match(/\d+$/)) {
      // Service name doesn't end with number (like "rowel" vs "rowel30")
      return standardDurations
    }

    // Service has specific duration configured, only show that option
    // But make sure it's one of our standard durations
    if (standardDurations.includes(defaultDuration)) {
      return [defaultDuration]
    }

    // If service has non-standard duration, default to flexible options
    return standardDurations
  }

  const availableDurations = getAvailableDurations()

  // Fetch available slots from Google Calendar
  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true)
    try {
      const response = await fetch('/api/calendar/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          duration: duration,
          serviceId: serviceId,
          clientTimezone: clientTimezone
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
      } else {
        // Fallback to demo slots if API fails
        setAvailableSlots([])
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      // Fallback to empty slots
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  // Get calendar dates for current month
  const getCalendarDates = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const dates = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  const calendarDates = getCalendarDates()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime('')
    fetchAvailableSlots(date)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    if (selectedDate) {
      onDateTimeSelect(selectedDate, time, duration, clientTimezone)
    }
  }

  const handleDurationSelect = (newDuration: number) => {
    setDuration(newDuration)
    if (selectedDate) {
      fetchAvailableSlots(selectedDate) // Refresh slots for new duration
    }
    if (selectedDate && selectedTime) {
      onDateTimeSelect(selectedDate, selectedTime, newDuration, clientTimezone)
    }
  }

  const isDateDisabled = (date: Date) => {
    const dateOnly = new Date(date)
    dateOnly.setHours(0, 0, 0, 0)
    return dateOnly < today || date.getDay() === 0 || date.getDay() === 6 // Disable past dates and weekends
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
      {/* Left Side - Calendar */}
      <div className="bg-teal-600 text-white p-8 rounded-lg">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Meet with Rowel Encinares</h2>
          <h3 className="text-xl">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-teal-700 rounded text-white"
          >
            ‹
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-teal-700 rounded text-white"
          >
            ›
          </button>
        </div>

        {/* Week Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-white opacity-80">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDates.map((date, index) => (
            <button
              key={index}
              onClick={() => !isDateDisabled(date) && handleDateSelect(date)}
              disabled={isDateDisabled(date)}
              className={`p-3 text-sm rounded transition-colors ${
                isDateDisabled(date)
                  ? 'text-teal-300 cursor-not-allowed opacity-50'
                  : isCurrentMonth(date)
                  ? selectedDate?.toDateString() === date.toDateString()
                    ? 'bg-white text-teal-600 font-bold'
                    : 'text-white hover:bg-teal-500'
                  : 'text-teal-300 hover:bg-teal-500'
              }`}
            >
              {date.getDate()}
            </button>
          ))}
        </div>
      </div>

      {/* Right Side - Time Selection */}
      <div className="space-y-6">
        {/* Duration Selection */}
        {availableDurations.length > 1 ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How long do you need?</h3>
            <div className="flex gap-2">
              {availableDurations.map((dur) => (
                <button
                  key={dur}
                  onClick={() => handleDurationSelect(dur)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    duration === dur
                      ? 'bg-gray-300 text-gray-700 border-gray-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {dur === 60 ? '1 hour' : `${dur} mins`}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Duration</h3>
            <div className="px-4 py-2 bg-gray-100 rounded-lg border text-gray-700">
              {defaultDuration === 60 ? '1 hour' : `${defaultDuration} minutes`}
            </div>
          </div>
        )}

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What time works best?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Showing times for {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>

            {/* Timezone Display */}
            <div className="mb-4">
              <div className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                {clientTimezone ? (
                  <>
                    <span className="font-medium">Your timezone:</span> {clientTimezone}
                    {coachTimezone && coachTimezone !== clientTimezone && (
                      <div className="text-xs text-gray-500 mt-1">
                        Coach is in {coachTimezone}
                      </div>
                    )}
                  </>
                ) : (
                  'Detecting timezone...'
                )}
              </div>
            </div>

            {/* Available Times */}
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading available times...</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableSlots.length > 0 ? (
                  availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${
                        selectedTime === time
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-teal-300 hover:bg-teal-50'
                      }`}
                    >
                      {time}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No available slots for this date. Please select another date.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!selectedDate && (
          <div className="text-center py-8 text-gray-500">
            Please select a date to see available times
          </div>
        )}
      </div>
    </div>
  )
}