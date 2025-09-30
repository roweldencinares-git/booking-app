import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Meeting {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
  service_type: string
  notes?: string
  client_name?: string
}

export default async function AdminRecapsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get ALL completed meetings (admin view)
  const { data: completedMeetings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      client_name,
      start_time,
      end_time,
      status,
      notes,
      booking_types(name)
    `)
    .eq('status', 'completed')
    .order('start_time', { ascending: false })
    .limit(50)

  const meetings: Meeting[] = (completedMeetings || []).map(meeting => ({
    ...meeting,
    title: `Session with ${meeting.client_name}`,
    service_type: meeting.booking_types?.name || 'Unknown Service'
  }))

  // Calculate stats
  const totalSessions = meetings.length
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const thisMonthSessions = meetings.filter(meeting =>
    new Date(meeting.start_time) >= thisMonth
  ).length

  const totalHours = meetings.reduce((acc, meeting) => {
    const start = new Date(meeting.start_time)
    const end = new Date(meeting.end_time)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return acc + duration
  }, 0)

  const stats = {
    totalSessions,
    thisMonthSessions,
    totalHours: Math.round(totalHours * 10) / 10
  }

  return (
    <AdminLayout currentPath="/admin/recaps">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Session Recaps</h1>
          <p className="text-gray-600 mt-2">Review all coaching sessions and client progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonthSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* All Sessions */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Completed Sessions</h2>
          </div>
          <div className="p-6">
            {meetings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed sessions yet</h3>
                <p className="text-gray-600">Completed sessions will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {meeting.title} ({meeting.service_type})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Client:</span> {meeting.client_name}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {new Date(meeting.start_time).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {new Date(meeting.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {Math.round((new Date(meeting.end_time).getTime() - new Date(meeting.start_time).getTime()) / (1000 * 60))} min
                          </div>
                        </div>
                        {meeting.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Session Notes:</span>
                            <p className="text-sm text-gray-600 mt-1">{meeting.notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Details
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                          Edit Notes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}