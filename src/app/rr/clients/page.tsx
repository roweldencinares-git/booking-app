'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Client {
  id: string; business_name: string; contact_name: string; email: string; phone: string; status: string; notes: string; created_at: string
  rr_rentals: { monthly_fee: number; status: string; rr_properties: { domain: string; location: string } }[]
}

const STATUS_COLOR: Record<string, string> = {
  prospect: 'bg-gray-100 text-gray-600',
  active:   'bg-emerald-100 text-emerald-700',
  paused:   'bg-yellow-100 text-yellow-700',
  churned:  'bg-red-100 text-red-600',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ business_name: '', contact_name: '', email: '', phone: '', status: 'prospect', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const data = await fetch('/api/rr/clients').then(r => r.json())
    setClients(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/rr/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setShowForm(false); setForm({ business_name: '', contact_name: '', email: '', phone: '', status: 'prospect', notes: '' }); load() }
    setSaving(false)
  }

  const activeMrr = (c: Client) => c.rr_rentals?.filter(r => r.status === 'active').reduce((s, r) => s + r.monthly_fee, 0) || 0
  const totalMrr = clients.reduce((s, c) => s + activeMrr(c), 0)

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">{clients.filter(c => c.status === 'active').length} active · ${totalMrr.toLocaleString()}/mo total MRR</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
          + Add Client
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="bg-white rounded-xl border border-emerald-200 p-5 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input required placeholder="Business name *" value={form.business_name} onChange={e => setForm(f => ({...f, business_name: e.target.value}))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input placeholder="Contact name" value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name: e.target.value}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
            </select>
            <input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {clients.map(c => {
          const mrr = activeMrr(c)
          const activeRentals = c.rr_rentals?.filter(r => r.status === 'active') || []
          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{c.business_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[c.status]}`}>{c.status}</span>
                  </div>
                  {c.contact_name && <p className="text-sm text-gray-500">{c.contact_name}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-sm">
                    {c.phone && <a href={`tel:${c.phone}`} className="text-indigo-600 hover:underline">📞 {c.phone}</a>}
                    {c.email && <a href={`mailto:${c.email}`} className="text-indigo-600 hover:underline">✉️ {c.email}</a>}
                  </div>
                  {activeRentals.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeRentals.map((r, i) => (
                        <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-medium">
                          {r.rr_properties?.domain} · ${r.monthly_fee}/mo
                        </span>
                      ))}
                    </div>
                  )}
                  {c.notes && <p className="text-xs text-gray-400 mt-2 bg-gray-50 px-3 py-2 rounded-lg">{c.notes}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  {mrr > 0 && <p className="text-xl font-bold text-emerald-600">${mrr.toLocaleString()}<span className="text-sm font-normal text-gray-400">/mo</span></p>}
                  <p className="text-xs text-gray-400 mt-1">Since {format(new Date(c.created_at), 'MMM yyyy')}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
