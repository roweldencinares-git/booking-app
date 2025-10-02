import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import MeetingsTable from '@/components/MeetingsTable'
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

  // Fetch upcoming bookings (from current moment forward)
  const now = new Date()

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
    .gte('start_time', now.toISOString())
    .eq('status', 'confirmed') // Only show confirmed bookings
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

  return (
    <AdminLayout currentPath="/admin/meetings">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Meetings</h1>
          <p className="text-gray-600 mt-2">View and manage all future confirmed meetings</p>
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
          <MeetingsTable meetings={upcomingMeetings} />
        )}
      </div>
    </AdminLayout>
  )
}