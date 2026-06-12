'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'

interface Lead {
  id: string; name: string; phone: string; email: string; message: string
  source: string; created_at: string; forwarded_at: string
  rr_properties: { domain: string; location: string; niche: string }
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'forwarded'>('all')

  useEffect(() => {
    fetch('/api/rr/leads').then(r => r.json()).then(d => {
      setLeads(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [])

  const filtered = leads.filter(l => {
    if (filter === 'new') return !l.forwarded_at
    if (filter === 'forwarded') return !!l.forwarded_at
    return true
  })

  const newCount = leads.filter(l => !l.forwarded_at).length

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Inbox</h1>
          <p className="text-gray-500 mt-1">{leads.length} total · {newCount} new</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'new', 'forwarded'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {f}{f === 'new' && newCount > 0 ? ` (${newCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">No leads found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => (
            <div key={l.id} className={`bg-white rounded-xl border p-5 ${!l.forwarded_at ? 'border-yellow-200 shadow-sm' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{l.name || 'Unknown visitor'}</h3>
                    {!l.forwarded_at
                      ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">New</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Forwarded</span>
                    }
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{l.source}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                    {l.phone && (
                      <a href={`tel:${l.phone}`} className="flex items-center gap-1 text-indigo-600 font-medium hover:underline">
                        📞 {l.phone}
                      </a>
                    )}
                    {l.email && (
                      <a href={`mailto:${l.email}`} className="flex items-center gap-1 text-indigo-600 hover:underline">
                        ✉️ {l.email}
                      </a>
                    )}
                  </div>
                  {l.message && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{l.message}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-gray-900">{l.rr_properties?.domain}</p>
                  <p className="text-xs text-gray-400">{l.rr_properties?.location}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</p>
                  {l.forwarded_at && (
                    <p className="text-xs text-emerald-600 mt-0.5">Fwd {format(new Date(l.forwarded_at), 'MMM d')}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
