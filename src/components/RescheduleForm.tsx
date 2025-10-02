'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Availability {
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

interface RescheduleFormProps {
  bookingId: string
  currentStartTime: string
  duration: number
  availability: Availability[]
}

export default function RescheduleForm({
  bookingId,
  currentStartTime,
  duration,
  availability
}: RescheduleFormProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Get available time slots for selected date
  const getAvailableTimeSlots = () => {
    if (!selectedDate) return []

    const date = new Date(selectedDate)
    const dayOfWeek = date.getDay()

    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek)
    if (!dayAvailability) return []

    const slots: string[] = []
    const [startHour, startMinute] = dayAvailability.start_time.split(':').map(Number)
    const [endHour, endMinute] = dayAvailability.end_time.split(':').map(Number)

    let currentHour = startHour
    let currentMinute = startMinute

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
      slots.push(timeString)

      // Increment by 15 minutes
      currentMinute += 15
      if (currentMinute >= 60) {
        currentMinute = 0
        currentHour += 1
      }
    }

    return slots
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time')
      setIsLoading(false)
      return
    }

    try {
      // Combine date and time as UTC (append 'Z' to ensure UTC interpretation)
      const newStartTime = new Date(selectedDate + 'T' + selectedTime + ':00Z')

      const response = await fetch('/api/booking/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          newStartTime: newStartTime.toISOString(),
          notes
        })
      })

      if (response.ok) {
        router.push('/admin/meetings?success=rescheduled')
      } else {
        const data = await response.json()
        console.error('Reschedule error response:', data)
        setError(data.error || 'Failed to reschedule booking')
      }
    } catch (err) {
      console.error('Reschedule error:', err)
      setError(err instanceof Error ? err.message : 'Failed to reschedule booking')
    } finally {
      setIsLoading(false)
    }
  }

  const timeSlots = getAvailableTimeSlots()

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Select New Date & Time</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setSelectedTime('') // Reset time when date changes
            }}
            min={minDate}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {selectedDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Time Slots
            </label>

            {timeSlots.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700 text-sm">No available time slots for this date</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => {
                  const [hours, minutes] = time.split(':')
                  const hour = parseInt(hours)
                  const ampm = hour >= 12 ? 'PM' : 'AM'
                  const displayHour = hour % 12 || 12
                  const displayTime = `${displayHour}:${minutes} ${ampm}`

                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        selectedTime === time
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      {displayTime}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add any additional notes about the reschedule..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !selectedDate || !selectedTime}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Rescheduling...' : 'Reschedule Booking'}
          </button>
        </div>
      </form>
    </div>
  )
}
