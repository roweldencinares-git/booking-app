'use client'

import { useState } from 'react'
import DateTimePicker from '../../components/DateTimePicker'

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
  const [selectedDateTime, setSelectedDateTime] = useState<{
    date: Date
    time: string
    duration: number
  } | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [step, setStep] = useState<'datetime' | 'details' | 'confirmation'>('datetime')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDateTimeSelect = (date: Date, time: string, duration: number) => {
    setSelectedDateTime({ date, time, duration })
    setStep('details')
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDateTime) return

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
          date: selectedDateTime.date.toISOString().split('T')[0],
          time: selectedDateTime.time,
          duration: selectedDateTime.duration,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          notes: customerInfo.notes,
        }),
      })

      if (response.ok) {
        setStep('confirmation')
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

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Your appointment has been scheduled successfully.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Appointment Details:</h3>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Service:</strong> {service.name}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>With:</strong> {service.users.first_name} {service.users.last_name}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Date:</strong> {selectedDateTime?.date.toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Time:</strong> {selectedDateTime?.time}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Duration:</strong> {selectedDateTime?.duration} minutes
              </p>
            </div>
            <p className="text-sm text-gray-500">
              You'll receive a confirmation email shortly with meeting details.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Book with {service.users.first_name}
              </h1>
              <p className="text-gray-600">{service.name}</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>⏱️ {service.duration} minutes</p>
              {service.price && <p>💰 ${service.price}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {step === 'datetime' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Select Date & Time
            </h2>
            <DateTimePicker
              onDateTimeSelect={handleDateTimeSelect}
              serviceId={service.id}
              defaultDuration={service.duration}
              serviceName={service.name}
            />
          </div>
        )}

        {step === 'details' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Details
              </h2>
              <button
                onClick={() => setStep('datetime')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Change Time
              </button>
            </div>

            {/* Selected time summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Selected Appointment:</h3>
              <p className="text-blue-800 text-sm">
                {selectedDateTime?.date.toLocaleDateString()} at {selectedDateTime?.time}
                ({selectedDateTime?.duration} minutes)
              </p>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                  placeholder="Anything you'd like to mention about this appointment..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {service.description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">About this service:</h4>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('datetime')}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}