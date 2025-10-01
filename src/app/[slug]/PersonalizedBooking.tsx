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
  const [timeSlots, setTimeSlots] = useState<{ value: string; display: string }[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

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
            const ampm = hour >= 12 ? 'pm' : 'am'
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
            const displayTime = `${displayHour}:${minuteStr} ${ampm}`
            return { value: time, display: displayTime }
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
  }, [selectedDate, selectedDuration, service.users.id])

  // Calendar generation
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
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
                  {getDaysInMonth(currentMonth).map((date, index) => (
                    <button
                      key={index}
                      onClick={() => date && handleDateSelect(date)}
                      disabled={!date || date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                        ${!date ? 'invisible' : ''}
                        ${date && date < new Date(new Date().setHours(0, 0, 0, 0)) ? 'text-white/30 cursor-not-allowed' : ''}
                        ${selectedDate?.toDateString() === date?.toDateString() ? 'bg-white text-primary-teal' : 'hover:bg-white/20 text-white'}
                      `}
                    >
                      {date?.getDate()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Time & Duration Selection */}
            <div>
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

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-accent-grey-900">What time works best?</h3>
                </div>
                {selectedDate && (
                  <p className="text-sm text-accent-grey-600 mb-4">
                    Showing times for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
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

                {selectedDate && !isLoadingSlots && timeSlots.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot.value}
                        onClick={() => handleTimeSelect(slot.value)}
                        className={`w-full py-3 px-4 rounded-lg border transition-colors text-left ${selectedTime === slot.value ? 'border-primary-blue bg-accent-light-blue text-primary-teal font-medium' : 'border-accent-grey-200 hover:border-primary-blue'}`}
                      >
                        {slot.display}
                      </button>
                    ))}
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
