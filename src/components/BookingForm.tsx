'use client'

import { useState } from 'react'

interface BookingFormProps {
  service: {
    id: string
    name: string
    duration_minutes?: number
    duration?: number
    price?: number
  }
  coach: {
    id: string
    first_name: string
    last_name: string
    email: string
    timezone?: string
    working_hours?: any
  }
}

export default function BookingForm({ service, coach }: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Generate available time slots for the selected date
  const generateTimeSlots = (date: string) => {
    const slots = []
    const startHour = 9 // 9 AM
    const endHour = 17 // 5 PM
    const duration = service.duration_minutes || service.duration || 30

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    return slots
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create the booking
      const startDateTime = new Date(`${formData.date}T${formData.time}`)

      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingTypeId: service.id,
          coachId: coach.id,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          startTime: startDateTime.toISOString(),
          notes: formData.notes,
          timezone: coach.timezone || 'America/New_York'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create booking')
      }

      const result = await response.json()
      setSuccess(true)

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        notes: ''
      })

    } catch (error) {
      console.error('Booking error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-primary-teal mb-2">
          Booking Confirmed!
        </h3>
        <p className="text-accent-grey-700 mb-6">
          Your appointment has been scheduled. You should receive a confirmation email shortly.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="bg-primary-blue text-white px-4 py-2 rounded-md hover:bg-primary-teal transition-colors"
        >
          Book Another Session
        </button>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const timeSlots = formData.date ? generateTimeSlots(formData.date) : []

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-error rounded-md p-4">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-accent-grey-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full border border-accent-grey-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-accent-grey-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full border border-accent-grey-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-accent-grey-700 mb-1">
          Phone Number (Optional)
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="w-full border border-accent-grey-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
        />
      </div>

      {/* Date and Time Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-accent-grey-700 mb-1">
            Select Date *
          </label>
          <input
            type="date"
            required
            min={today}
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value, time: '' }))}
            className="w-full border border-accent-grey-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-accent-grey-700 mb-1">
            Select Time *
          </label>
          <select
            required
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            disabled={!formData.date}
            className="w-full border border-accent-grey-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent disabled:bg-accent-grey-100"
          >
            <option value="">
              {formData.date ? 'Select a time' : 'Select date first'}
            </option>
            {timeSlots.map(slot => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium text-accent-grey-700 mb-1">
          Additional Notes (Optional)
        </label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any specific topics you'd like to discuss or questions you have..."
          className="w-full border border-accent-grey-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-blue text-white py-3 px-4 rounded-md hover:bg-primary-teal disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? 'Booking...' : 'Confirm Booking'}
        </button>
      </div>

      <div className="text-center text-sm text-accent-grey-500">
        By booking this session, you agree to our{' '}
        <a href="/terms" className="text-primary-blue hover:text-primary-teal transition-colors">terms of service</a>
        {' '}and{' '}
        <a href="/privacy" className="text-primary-blue hover:text-primary-teal transition-colors">privacy policy</a>.
      </div>
    </form>
  )
}