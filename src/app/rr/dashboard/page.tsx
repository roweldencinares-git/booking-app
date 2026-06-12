'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Property {
  id: string; domain: string; niche: string; location: string; status: string; monthly_value: number
  rr_rentals: { monthly_fee: number; status: string; rr_clients: { business_name: string } }[]
}
interface Lead {
  id: string; name: string; phone: string; email: string; message: string
  created_at: string; forwarded_at: string
  rr_properties: { domain: string; location: string }
}

const STATUS_COLOR: Record<string, string> = {
  building: 'bg-gray-100 text-gray-600',
  ranked:   'bg-blue-100 text-blue-700',
  available:'bg-yellow-100 text-yellow-700',
  rented:   'bg-emerald-100 text-emerald-700',
  paused:   'bg-red-100 text-red-600',
}

export default function RrDashboard() {
  const [properties, setProperties] = useState<Property[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/rr/properties').then(r => r.json()),
      fetch('/api/rr/leads').then(r => r.json()),
    ]).then(([p, l]) => {
      setProperties(Array.isArray(p) ? p : [])
      setLeads(Array.isArray(l) ? l : [])
      setLoading(false)
    })
  }, [])

  const mrr = properties.reduce((sum, p) =>
    sum + (p.rr_rentals?.filter(r => r.status === 'active').reduce((s, r) => s + r.monthly_fee, 0) || 0), 0)

  const rented    = properties.filter(p => p.status === 'rented').length
  const available = properties.filter(p => p.status === 'available').length
  const ranked    = properties.filter(p => p.status === 'ranked').length
  const unforwarded = leads.filter(l => !l.forwarded_at).length
  const recentLeads = leads.slice(0, 8)

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Rank & Rent OS</h1>
        <p className="text-gray-500 mt-1">Your property portfolio at a glance</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Monthly Revenue', value: `$${mrr.toLocaleString()}`, color: 'text-emerald-600', big: true },
          { label: 'Rented',    value: rented,    color: 'text-emerald-600' },
          { label: 'Available', value: available, color: 'text-yellow-600' },
          { label: 'Ranked',    value: ranked,    color: 'text-blue-600' },
          { label: 'New Leads', value: unforwarded, color: unforwarded > 0 ? 'text-red-600' : 'text-gray-600' },
        ].map(({ label, value, color, big }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
            <p className={`font-bold mt-1 ${color} ${big ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Properties */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Properties</h2>
            <Link href="/rr/properties" className="text-sm text-emerald-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {properties.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.domain}</p>
                  <p className="text-xs text-gray-400">{p.location} · {p.niche}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  {p.rr_rentals?.filter(r => r.status === 'active')[0] && (
                    <span className="text-sm font-semibold text-gray-900">
                      ${p.rr_rentals.filter(r => r.status === 'active')[0].monthly_fee}/mo
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[p.status]}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead inbox */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Leads</h2>
            <Link href="/rr/leads" className="text-sm text-emerald-600 hover:underline">View all</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No leads yet</p>
          ) : (
            <div className="space-y-2">
              {recentLeads.map(l => (
                <div key={l.id} className={`flex items-start justify-between py-2 border-b border-gray-50 last:border-0 ${!l.forwarded_at ? 'bg-yellow-50 -mx-2 px-2 rounded-lg' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{l.rr_properties?.domain} · {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</p>
                    {l.phone && <p className="text-xs text-indigo-600 font-medium">{l.phone}</p>}
                  </div>
                  {!l.forwarded_at
                    ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">New</span>
                    : <span className="text-xs text-gray-300 flex-shrink-0">Fwd ✓</span>
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick lead capture embed snippet */}
      <div className="mt-6 bg-gray-900 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Universal Lead Capture — Paste on any rank & rent site</p>
        <pre className="text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">{`<form action="https://meetings.spearity.com/api/rr/leads" method="post" onsubmit="handleSubmit(event)">
  <input type="hidden" name="property_domain" value="YOUR-DOMAIN.com">
  <input type="text"   name="name"    placeholder="Your Name"  required>
  <input type="tel"    name="phone"   placeholder="Phone"      required>
  <input type="email"  name="email"   placeholder="Email">
  <textarea name="message" placeholder="How can we help?"></textarea>
  <button type="submit">Get Free Quote</button>
</form>
<script>
async function handleSubmit(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  await fetch('https://meetings.spearity.com/api/rr/leads', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)
  });
  alert('Thank you! We will contact you shortly.');
  e.target.reset();
}
</script>`}</pre>
      </div>
    </div>
  )
}
