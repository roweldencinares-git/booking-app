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
  staff_name?: string
}

export default async function DashboardMeetingsPage() {
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

  // Fetch user's bookings (both upcoming and past)
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      title,
      start_time,
      end_time,
      status,
      meeting_url,
      booking_types(name),
      staff:staff_id(first_name, last_name)
    `)
    .eq('client_id', dbUser.id)
    .order('start_time', { ascending: false })

  const allMeetings: Booking[] = (bookings || []).map(booking => ({
    ...booking,
    service_type: booking.booking_types?.name || 'Unknown Service',
    staff_name: booking.staff ? `${booking.staff.first_name} ${booking.staff.last_name}` : 'Unknown Staff'
  }))

  const now = new Date()
  const upcomingMeetings = allMeetings.filter(meeting => new Date(meeting.start_time) >= now)
  const pastMeetings = allMeetings.filter(meeting => new Date(meeting.start_time) < now)

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
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

  const MeetingCard = ({ meeting, isPast = false }: { meeting: Booking; isPast?: boolean }) => {
    const dateTime = formatDateTime(meeting.start_time)
    const endTime = formatDateTime(meeting.end_time)

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {meeting.title || meeting.service_type}
            </h3>
            <p className="text-sm text-gray-600">with {meeting.staff_name}</p>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
            {meeting.status}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">📅</span>
            {dateTime.date}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">🕐</span>
            {dateTime.time} - {endTime.time}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">📋</span>
            {meeting.service_type}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPast && meeting.meeting_url && meeting.status === 'confirmed' && (
            <a
              href={meeting.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Join Meeting
            </a>
          )}
          {!isPast && meeting.status === 'confirmed' && (
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              Reschedule
            </button>
          )}
          {!isPast && (
            <button className="inline-flex items-center px-3 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                BookingApp
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2"
              >
                Dashboard
              </Link>
              <Link
                href="/admin"
                className="text-gray-700 hover:text-gray-900 px-3 py-2"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                Dashboard
              </Link>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li>
              <span className="text-gray-900 font-medium">My Meetings</span>
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Meetings</h1>
          <p className="text-gray-600 mt-2">View and manage all your coaching sessions</p>
        </div>

        {/* Quick Action */}
        <div className="mb-8">
          <Link
            href="/book"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">📅</span>
            Book New Session
          </Link>
        </div>

        {/* Upcoming Meetings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Meetings ({upcomingMeetings.length})
          </h2>
          {upcomingMeetings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </div>

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Past Meetings ({pastMeetings.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastMeetings.slice(0, 6).map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} isPast={true} />
              ))}
            </div>
            {pastMeetings.length > 6 && (
              <div className="text-center mt-6">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Load More Past Meetings
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}