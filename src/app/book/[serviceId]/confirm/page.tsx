import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface ConfirmPageProps {
  params: Promise<{ serviceId: string }>
  searchParams: Promise<{ bookingId?: string }>
}

export default async function ConfirmPage({ params, searchParams }: ConfirmPageProps) {
  const { serviceId } = await params
  const { bookingId } = await searchParams
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (!bookingId) {
    notFound()
  }

  // Get booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      booking_types(
        name,
        duration,
        price,
        users(first_name, last_name, email)
      )
    `)
    .eq('id', bookingId)
    .single()

  if (!booking) {
    notFound()
  }

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr)
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    return `${dateStr} at ${timeStr}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Booking Confirmed!
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">

          {/* Success Header */}
          <div className="bg-green-50 border-b border-green-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-green-900">
                  Your appointment has been successfully booked!
                </h2>
                <p className="text-green-700">
                  A confirmation email has been sent to {booking.client_email}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Appointment Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Left Column - Service & Time */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Service</h4>
                  <p className="text-gray-700">{booking.booking_types.name}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Date & Time</h4>
                  <p className="text-gray-700">{formatDateTime(booking.start_time)}</p>
                  <p className="text-sm text-gray-500">Philippine Time (GMT+8)</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Duration</h4>
                  <p className="text-gray-700">{booking.booking_types.duration} minutes</p>
                </div>

                {booking.booking_types.price && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Price</h4>
                    <p className="text-gray-700">${booking.booking_types.price}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Provider & Client */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Service Provider</h4>
                  <p className="text-gray-700">
                    {booking.booking_types.users.first_name} {booking.booking_types.users.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{booking.booking_types.users.email}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Your Information</h4>
                  <p className="text-gray-700">{booking.client_name}</p>
                  <p className="text-sm text-gray-500">{booking.client_email}</p>
                  {booking.client_phone && (
                    <p className="text-sm text-gray-500">{booking.client_phone}</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Booking ID</h4>
                  <p className="text-sm text-gray-500 font-mono">{booking.id}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
                <p className="text-gray-700">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Meeting Info */}
          <div className="bg-blue-50 border-t border-blue-200 p-6">
            <h4 className="font-medium text-blue-900 mb-2">
              Web Conferencing Details
            </h4>
            <p className="text-blue-700 text-sm">
              Meeting details will be provided via email closer to your appointment time.
              Please check your email for the meeting link and instructions.
            </p>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 border-t px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="flex-1 bg-blue-600 text-white text-center px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Home
              </Link>

              <Link
                href="/book"
                className="flex-1 bg-white text-blue-600 text-center px-4 py-2 rounded-md border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Book Another Appointment
              </Link>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Need to reschedule or cancel?
                <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-800 ml-1">
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}