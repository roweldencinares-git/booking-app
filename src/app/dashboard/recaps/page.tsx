import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import RecapsContent from '@/components/RecapsContent'

export const dynamic = 'force-dynamic'

interface Meeting {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
  service_type: string
  notes?: string
}

export default async function RecapsPage() {
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

  // Fetch user's completed meetings for recaps
  const { data: completedMeetings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      title,
      start_time,
      end_time,
      status,
      notes,
      booking_types(name)
    `)
    .eq('client_id', dbUser.id)
    .eq('status', 'completed')
    .order('start_time', { ascending: false })
    .limit(20)

  const meetings: Meeting[] = (completedMeetings || []).map(meeting => ({
    ...meeting,
    service_type: meeting.booking_types?.name || 'Unknown Service'
  }))

  // Calculate session stats
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
    <RecapsContent meetings={meetings} stats={stats} />
  )
}