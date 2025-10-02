import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import RescheduleForm from '@/components/RescheduleForm'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ReschedulePage({ params }: PageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch the booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      end_time,
      client_name,
      client_email,
      client_phone,
      status,
      notes,
      user_id,
      booking_types(id, name, duration, user_id)
    `)
    .eq('id', params.id)
    .single()

  if (error || !booking) {
    notFound()
  }

  // Check if booking belongs to current user
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!user || booking.user_id !== user.id) {
    notFound()
  }

  if (booking.status === 'cancelled') {
    return (
      <AdminLayout currentPath="/admin/meetings">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Cannot Reschedule</h2>
            <p className="text-red-700">This booking has been cancelled and cannot be rescheduled.</p>
            <a href="/admin/meetings" className="mt-4 inline-block text-red-600 hover:text-red-800">
              ← Back to Meetings
            </a>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // Fetch availability for the user
  const { data: availability } = await supabase
    .from('availability')
    .select('*')
    .eq('user_id', booking.user_id)
    .eq('is_available', true)

  return (
    <AdminLayout currentPath="/admin/meetings">
      <div className="p-8">
        <div className="mb-6">
          <a href="/admin/meetings" className="text-indigo-600 hover:text-indigo-800">
            ← Back to Meetings
          </a>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reschedule Booking</h1>
          <p className="text-gray-600 mt-2">Change the date and time for this appointment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Booking Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Booking</h2>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Service</label>
                  <p className="text-gray-900">{booking.booking_types?.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Client</label>
                  <p className="text-gray-900">{booking.client_name}</p>
                  <p className="text-sm text-gray-500">{booking.client_email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Current Time</label>
                  <p className="text-gray-900">
                    {new Date(booking.start_time).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-gray-900">{booking.booking_types?.duration || 30} minutes</p>
                </div>

                {booking.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-gray-900">{booking.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reschedule Form */}
          <div className="lg:col-span-2">
            <RescheduleForm
              bookingId={booking.id}
              currentStartTime={booking.start_time}
              duration={booking.booking_types?.duration || 30}
              availability={availability || []}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
