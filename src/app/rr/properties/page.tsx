'use client'

import { useEffect, useRef, useState } from 'react'

interface Property {
  id: string; domain: string; niche: string; location: string
  status: string; monthly_value: number; notes: string
  rr_rentals: { monthly_fee: number; status: string; rr_clients: { business_name: string } }[]
}

const COLS = [
  { id: 'building',  label: 'Building',  color: 'bg-gray-50',    dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-600'    },
  { id: 'ranked',    label: 'Ranked',    color: 'bg-blue-50',    dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700'    },
  { id: 'available', label: 'Available', color: 'bg-yellow-50',  dot: 'bg-yellow-400',  badge: 'bg-yellow-100 text-yellow-700'},
  { id: 'rented',    label: 'Rented',    color: 'bg-emerald-50', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700'},
] as const

type Status = (typeof COLS)[number]['id']

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState<Status | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ domain: '', niche: '', location: '', status: 'building', notes: '' })
  const [saving, setSaving] = useState(false)
  const dragging = useRef<string | null>(null)

  const load = async () => {
    const data = await fetch('/api/rr/properties').then(r => r.json())
    setProperties(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const moveStatus = async (id: string, status: Status) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    await fetch(`/api/rr/properties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  const saveProperty = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/rr/properties', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setShowForm(false); setForm({ domain: '', niche: '', location: '', status: 'building', notes: '' }); load() }
    setSaving(false)
  }

  const activeRental = (p: Property) => p.rr_rentals?.find(r => r.status === 'active')

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 mt-1">{properties.length} sites · drag to update status</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
          + Add Property
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveProperty} className="bg-white rounded-xl border border-emerald-200 p-5 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input required placeholder="domain.com *" value={form.domain} onChange={e => setForm(f => ({...f, domain: e.target.value}))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input placeholder="Niche (e.g. Grease Trap)" value={form.niche} onChange={e => setForm(f => ({...f, niche: e.target.value}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input placeholder="Location (e.g. Toronto ON)" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLS.map(col => {
          const colProps = properties.filter(p => p.status === col.id)
          const isOver = dragOver === col.id
          const colMrr = colProps.reduce((s, p) => s + (activeRental(p)?.monthly_fee || 0), 0)
          return (
            <div key={col.id}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => { moveStatus(dragging.current!, col.id); dragging.current = null; setDragOver(null) }}
              className={`flex-shrink-0 w-64 rounded-xl border-2 transition-colors ${isOver ? 'border-emerald-400 bg-emerald-50' : `border-transparent ${col.color}`}`}>
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{col.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>{colProps.length}</span>
                </div>
                {colMrr > 0 && <p className="text-xs text-emerald-600 font-semibold mt-0.5">${colMrr.toLocaleString()}/mo</p>}
              </div>

              {isOver && <div className="mx-3 mb-2 border-2 border-dashed border-emerald-300 rounded-lg h-14 flex items-center justify-center"><span className="text-xs text-emerald-400">Drop here</span></div>}

              <div className="px-3 pb-3 space-y-2 min-h-20">
                {colProps.length === 0 && !isOver && <p className="text-xs text-gray-300 text-center py-6">No sites</p>}
                {colProps.map(p => {
                  const rental = activeRental(p)
                  return (
                    <div key={p.id} draggable onDragStart={() => { dragging.current = p.id }}
                      className="bg-white rounded-lg border border-gray-100 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow select-none">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.domain}</p>
                      {p.location && <p className="text-xs text-gray-400 mt-0.5">{p.location}</p>}
                      {p.niche && <p className="text-xs text-gray-400">{p.niche}</p>}
                      {rental && (
                        <div className="mt-2 pt-2 border-t border-gray-50">
                          <p className="text-xs font-semibold text-emerald-600">${rental.monthly_fee}/mo</p>
                          <p className="text-xs text-gray-400 truncate">{rental.rr_clients?.business_name}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
