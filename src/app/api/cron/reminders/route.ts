import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendSessionReminder, sendPostSessionFollowUp } from '@/lib/emailTemplates'
import { addHours, subHours, isAfter, isBefore } from 'date-fns'

// Vercel cron: runs every hour
// Sends 24hr reminders and post-session follow-ups
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // 24hr reminders: sessions starting in 23–25 hours
  const reminderWindowStart = addHours(now, 23)
  const reminderWindowEnd = addHours(now, 25)

  const { data: upcomingSessions } = await supabase
    .from('bookings')
    .select('*, booking_types(name, duration)')
    .eq('status', 'confirmed')
    .gte('start_time', reminderWindowStart.toISOString())
    .lte('start_time', reminderWindowEnd.toISOString())

  let reminders = 0
  for (const session of upcomingSessions || []) {
    try {
      await sendSessionReminder(session.client_email, {
        clientName: session.client_name,
        sessionType: session.booking_types.name,
        startTime: session.start_time,
        duration: session.booking_types.duration,
        zoomJoinUrl: session.zoom_join_url,
        zoomPassword: session.zoom_password,
        hoursUntil: 24,
      })
      reminders++
    } catch {}
  }

  // Post-session follow-ups: sessions that ended in the last 60 minutes
  const followUpWindowStart = subHours(now, 1)
  const followUpWindowEnd = now

  const { data: completedSessions } = await supabase
    .from('bookings')
    .select('*, booking_types(name, duration)')
    .eq('status', 'confirmed')
    .gte('end_time', followUpWindowStart.toISOString())
    .lte('end_time', followUpWindowEnd.toISOString())

  let followUps = 0
  for (const session of completedSessions || []) {
    try {
      await sendPostSessionFollowUp(session.client_email, {
        clientName: session.client_name,
        sessionType: session.booking_types.name,
      })
      // Mark as completed
      await supabase.from('bookings').update({ status: 'completed' }).eq('id', session.id)
      followUps++
    } catch {}
  }

  return NextResponse.json({ reminders, followUps, ran: now.toISOString() })
}
