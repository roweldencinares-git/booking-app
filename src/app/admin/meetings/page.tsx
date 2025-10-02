import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Booking {
  id: string
  start_time: string
  end_time: string
  client_name: string
  client_email: string
  client_phone?: string
  status: string
  notes?: string
  service_type: string
  service_duration?: number
}

export default async function MeetingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch upcoming bookings
  const { data: bookings, error } = await supabase
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
      booking_types(name, duration)
    `)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(20)

  if (error) {
    console.error('Error fetching bookings:', error)
  }

  const upcomingMeetings: Booking[] = (bookings || []).map(booking => ({
    ...booking,
    service_type: booking.booking_types?.name || 'Unknown Service',
    service_duration: booking.booking_types?.duration
  }))

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AdminLayout currentPath="/admin/meetings">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Meetings</h1>
          <p className="text-gray-600 mt-2">Manage and view all scheduled meetings</p>
        </div>

        {upcomingMeetings.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📅</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming meetings</h3>
            <p className="text-gray-600">When clients book appointments, they'll appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meeting Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingMeetings.map((meeting) => {
                    const dateTime = formatDateTime(meeting.start_time)
                    const endTime = formatDateTime(meeting.end_time)

                    return (
                      <tr key={meeting.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {meeting.service_type}
                            </div>
                            <div className="text-sm text-gray-500">
                              {meeting.service_duration || 30} minutes
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {meeting.client_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {meeting.client_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {dateTime.date}
                            </div>
                            <div className="text-sm text-gray-500">
                              {dateTime.time} - {endTime.time}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-indigo-600 hover:text-indigo-900">
                              View Details
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              Reschedule
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}