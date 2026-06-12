'use client'

import { useEffect, useState } from 'react'
import { format, isFuture } from 'date-fns'

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

const STATUS = {
  confirmed:  { label: 'Confirmed',  bg: 'bg-green-100',  text: 'text-green-700' },
  completed:  { label: 'Completed',  bg: 'bg-gray-100',   text: 'text-gray-600' },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-100',    text: 'text-red-600'  },
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portal/sessions').then(r => r.json()).then(d => {
      setSessions(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [])

  const filtered = sessions.filter(s => {
    if (filter === 'upcoming') return isFuture(new Date(s.start_time)) && s.status === 'confirmed'
    if (filter === 'past') return !isFuture(new Date(s.start_time)) || s.status !== 'confirmed'
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-500 mt-1">{sessions.length} total</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'upcoming', 'past'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">No sessions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const st = STATUS[s.status]
            const upcoming = isFuture(new Date(s.start_time)) && s.status === 'confirmed'
            return (
              <div key={s.id} className={`bg-white rounded-xl border p-5 ${upcoming ? 'border-indigo-200 shadow-sm' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{s.booking_types.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                    </div>
                    <p className="text-gray-600">
                      {format(new Date(s.start_time), 'EEEE, MMMM d, yyyy')} · {format(new Date(s.start_time), 'h:mm a')} – {format(new Date(s.end_time), 'h:mm a')}
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">{s.booking_types.duration} minutes</p>
                    {s.notes && (
                      <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">{s.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    {s.zoom_join_url && upcoming && (
                      <a href={s.zoom_join_url} target="_blank" rel="noreferrer"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap">
                        Join Zoom
                      </a>
                    )}
                    {s.zoom_password && upcoming && (
                      <p className="text-xs text-gray-400">Password: <span className="font-mono">{s.zoom_password}</span></p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
