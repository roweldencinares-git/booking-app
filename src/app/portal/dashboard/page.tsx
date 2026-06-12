'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { format, isFuture, isPast, differenceInDays, differenceInHours } from 'date-fns'

interface Session {
  id: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  zoom_join_url?: string
  zoom_password?: string
  booking_types: { name: string; duration: number; price?: number }
}

function timeUntil(dateStr: string) {
  const date = new Date(dateStr)
  const hours = differenceInHours(date, new Date())
  if (hours < 1) return 'Starting soon'
  if (hours < 24) return `In ${hours}h`
  const days = differenceInDays(date, new Date())
  return `In ${days} day${days !== 1 ? 's' : ''}`
}

export default function PortalDashboard() {
  const { user } = useUser()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portal/sessions').then(r => r.json()).then(d => {
      setSessions(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [])

  const upcoming = sessions.filter(s => isFuture(new Date(s.start_time)) && s.status === 'confirmed')
  const past = sessions.filter(s => isPast(new Date(s.start_time)) || s.status !== 'confirmed')
  const next = upcoming[0]

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back{user?.firstName ? `, ${user.firstName}` : ''} 👋</h1>
        <p className="text-gray-500 mt-1">Here's your coaching overview.</p>
      </div>

      {/* Next session hero */}
      {next ? (
        <div className="bg-indigo-600 text-white rounded-2xl p-6 mb-6">
          <p className="text-indigo-200 text-sm font-medium uppercase tracking-wide mb-1">Next Session</p>
          <h2 className="text-xl font-bold mb-1">{next.booking_types.name}</h2>
          <p className="text-indigo-100 text-lg">
            {format(new Date(next.start_time), 'EEEE, MMMM d')} at {format(new Date(next.start_time), 'h:mm a')}
          </p>
          <p className="text-indigo-200 text-sm mt-1">{timeUntil(next.start_time)} · {next.booking_types.duration} min</p>
          <div className="mt-4 flex gap-3">
            {next.zoom_join_url && (
              <a href={next.zoom_join_url} target="_blank" rel="noreferrer"
                className="bg-white text-indigo-700 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-indigo-50 transition-colors">
                Join Zoom
              </a>
            )}
            <Link href="/portal/sessions" className="border border-indigo-400 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
              View all sessions
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 mb-6 text-center">
          <p className="text-gray-400 mb-3">No upcoming sessions scheduled</p>
          <Link href="/" className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            Book a Session
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Upcoming', value: upcoming.length, color: 'text-indigo-600' },
          { label: 'Completed', value: past.filter(s => s.status === 'completed').length, color: 'text-green-600' },
          { label: 'Total Sessions', value: sessions.length, color: 'text-gray-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming list */}
      {upcoming.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
          <div className="space-y-3">
            {upcoming.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.booking_types.name}</p>
                  <p className="text-xs text-gray-400">{format(new Date(s.start_time), 'EEE MMM d · h:mm a')} · {s.booking_types.duration} min</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-600 font-medium">{timeUntil(s.start_time)}</span>
                  {s.zoom_join_url && (
                    <a href={s.zoom_join_url} target="_blank" rel="noreferrer"
                      className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-100 font-medium">
                      Join
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book again CTA */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">Need to book another session?</p>
          <p className="text-sm text-gray-400 mt-0.5">Pick a time that works for you.</p>
        </div>
        <Link href="/" className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          Book Now
        </Link>
      </div>
    </div>
  )
}
