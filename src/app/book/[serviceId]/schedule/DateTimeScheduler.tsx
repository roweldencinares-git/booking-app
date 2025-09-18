'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DateTimePicker from '../../../../components/DateTimePicker'

interface DateTimeSchedulerProps {
  serviceId: string
  service: any
}

export default function DateTimeScheduler({ serviceId, service }: DateTimeSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | undefined>()
  const router = useRouter()

  const handleDateTimeSelect = (date: Date, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
  }

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      // Create URL with booking details
      const bookingParams = new URLSearchParams({
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        duration: service.duration.toString(),
        serviceId: serviceId
      })

      router.push(`/book/${serviceId}/details?${bookingParams.toString()}`)
    }
  }

  const formatSelectedDateTime = () => {
    if (!selectedDate || !selectedTime) return ''

    const dateStr = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `${dateStr} at ${selectedTime}`
  }

  return (
    <div className="space-y-6">
      <DateTimePicker
        onDateTimeSelect={handleDateTimeSelect}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        service={service}
      />

      {/* Selected Date/Time Summary */}
      {selectedDate && selectedTime && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-1">Selected Time</h3>
          <p className="text-blue-700">{formatSelectedDateTime()}</p>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
          className={`
            px-6 py-3 rounded-lg font-medium transition-colors
            ${selectedDate && selectedTime
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Continue
        </button>
      </div>
    </div>
  )
}