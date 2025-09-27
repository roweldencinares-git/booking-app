import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Booking {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
  meeting_url?: string
  service_type: string
}

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get user from database
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!dbUser) {
    redirect('/sign-in')
  }

  // Fetch user's upcoming bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      title,
      start_time,
      end_time,
      status,
      meeting_url,
      booking_types(name)
    `)
    .eq('client_id', dbUser.id)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(5)

  const upcomingMeetings: Booking[] = (bookings || []).map(booking => ({
    ...booking,
    service_type: booking.booking_types?.name || 'Unknown Service'
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
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your bookings and schedule</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/book"
          className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-400 transition-colors">
              <span className="text-white text-lg">📅</span>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Book a Session</h3>
              <p className="text-blue-100 text-sm">Schedule a new coaching session</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/meetings"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <span className="text-purple-600 text-lg">📋</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">My Meetings</h3>
              <p className="text-sm text-gray-600">View all your bookings</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/recaps"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <span className="text-orange-600 text-lg">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recaps</h3>
              <p className="text-sm text-gray-600">View session analytics and insights</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Upcoming Meetings */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Meetings</h2>
            <Link
              href="/dashboard/meetings"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
        </div>

        <div className="p-6">
          {upcomingMeetings.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📅</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming meetings</h3>
              <p className="text-gray-600 mb-4">Ready to book your next session?</p>
              <Link
                href="/book"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book a Session
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => {
                const dateTime = formatDateTime(meeting.start_time)
                const endTime = formatDateTime(meeting.end_time)

                return (
                  <div key={meeting.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {meeting.title || meeting.service_type}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {dateTime.date} • {dateTime.time} - {endTime.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {meeting.meeting_url && (
                        <a
                          href={meeting.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Join Meeting
                        </a>
                      )}
                      <Link
                        href={`/dashboard/meetings/${meeting.id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}