'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface DateTimePickerProps {
  onDateTimeSelect: (date: Date, time: string) => void
  selectedDate?: Date
  selectedTime?: string
  service?: any
  availableSlots?: string[]
}

export default function DateTimePicker({
  onDateTimeSelect,
  selectedDate,
  selectedTime,
  service,
  availableSlots = []
}: DateTimePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [realTimeSlots, setRealTimeSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isSelectedDate = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  // Fetch availability when date is selected
  useEffect(() => {
    if (selectedDate && service) {
      fetchAvailability(selectedDate)
    }
  }, [selectedDate, service])

  const fetchAvailability = async (date: Date) => {
    setLoadingSlots(true)
    try {
      const dateString = date.toISOString().split('T')[0]
      const userId = service.user_id || service.users?.id
      console.log('Fetching availability for userId:', userId, 'date:', dateString, 'duration:', service.duration)

      const response = await fetch(`/api/availability?userId=${userId}&date=${dateString}&duration=${service.duration}`)
      const data = await response.json()
      console.log('Availability response:', data)

      setRealTimeSlots(data.available_times || [])
    } catch (error) {
      console.error('Error fetching availability:', error)
      setRealTimeSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateSelect = (date: Date) => {
    // Always trigger date selection to show time slots
    onDateTimeSelect(date, selectedTime || '')
  }

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      onDateTimeSelect(selectedDate, time)
    }
  }

  // Default available time slots (24-hour format, will be converted to 12-hour for display)
  const defaultTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ]

  // Convert 24-hour time to 12-hour format for display
  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'pm' : 'am'
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  // Use real-time slots if available, otherwise fall back to default or provided slots
  const timeSlots = realTimeSlots.length > 0 ? realTimeSlots :
                   (availableSlots.length > 0 ? availableSlots : defaultTimeSlots)

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      {/* Service Information */}
      {service && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {service.name}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="mr-2">⏱️</span>
              <span>{service.duration} minutes</span>
            </div>
            {service.price && service.price > 0 && (
              <div className="flex items-center">
                <span className="mr-2">💰</span>
                <span>${service.price}</span>
              </div>
            )}
            {service.price === 0 && (
              <div className="flex items-center text-green-600">
                <span className="mr-2">🎁</span>
                <span>Free</span>
              </div>
            )}
          </div>
          {service.description && (
            <p className="text-sm text-gray-600 mt-2">{service.description}</p>
          )}
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900">
          {formatMonthYear(currentMonth)}
        </h2>

        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {/* Day headers */}
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {getDaysInMonth(currentMonth).map((date, index) => (
          <div key={index} className="aspect-square">
            {date && (
              <button
                onClick={() => handleDateSelect(date)}
                disabled={isPastDate(date)}
                className={`
                  w-full h-full flex items-center justify-center text-sm rounded-md transition-colors
                  ${isPastDate(date)
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'hover:bg-blue-50 cursor-pointer'
                  }
                  ${isToday(date) ? 'bg-blue-100 text-blue-700 font-semibold' : ''}
                  ${isSelectedDate(date) ? 'bg-blue-600 text-white' : ''}
                `}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <>
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Available Times
              {loadingSlots && <span className="text-sm text-gray-500 ml-2">(Loading...)</span>}
            </h3>

            {loadingSlots ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : timeSlots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`
                      px-3 py-2 text-sm rounded-md border transition-colors
                      ${selectedTime === time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                      }
                    `}
                  >
                    {formatTime12Hour(time)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No available times for this date.</p>
                <p className="text-sm mt-1">Please select another date.</p>
              </div>
            )}
          </div>

          {/* Timezone */}
          <div className="mt-6 pt-6 border-t">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Time zone</span>
              <div className="mt-1 flex items-center">
                <span className="mr-2">🌍</span>
                Philippine Time (GMT+8)
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}