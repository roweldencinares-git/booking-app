'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { DEAL_STAGES, formatCurrency, type CrmDeal, type DealStage } from '@/lib/crm-types'

export default function DealsPage() {
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', value: '', stage: 'lead' as DealStage, contact_id: '', close_date: '' })
  const [contacts, setContacts] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState<DealStage | null>(null)
  const dragging = useRef<string | null>(null)

  const load = async () => {
    const data = await fetch('/api/crm/deals').then(r => r.json())
    setDeals(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/crm/contacts').then(r => r.json()).then(d => setContacts(Array.isArray(d) ? d : []))
  }, [])

  const byStage = (stage: DealStage) => deals.filter(d => d.stage === stage)
  const stageValue = (stage: DealStage) => byStage(stage).reduce((s, d) => s + (d.value || 0), 0)

  const saveDeal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = {
      ...form,
      value: parseFloat(form.value) || 0,
      contact_id: form.contact_id || null,
      close_date: form.close_date || null,
    }
    const res = await fetch('/api/crm/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ title: '', value: '', stage: 'lead', contact_id: '', close_date: '' })
      load()
    }
    setSaving(false)
  }

  const moveToStage = async (id: string, stage: DealStage) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))
    await fetch(`/api/crm/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
  }

  const onDrop = (stage: DealStage) => {
    const id = dragging.current
    if (!id) return
    dragging.current = null
    setDragOver(null)
    moveToStage(id, stage)
  }

  const openPipelineValue = deals
    .filter(d => !['won', 'lost'].includes(d.stage))
    .reduce((s, d) => s + d.value, 0)

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-500 mt-1">
            {deals.filter(d => !['won', 'lost'].includes(d.stage)).length} open · {formatCurrency(openPipelineValue)} pipeline · drag cards to move stages
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + New Deal
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveDeal} className="bg-white rounded-xl border border-indigo-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Deal</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              required placeholder="Deal title *"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number" placeholder="Value ($)"
              value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as DealStage }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DEAL_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select
              value={form.contact_id} onChange={e => setForm(f => ({ ...f, contact_id: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No contact</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
            <input
              type="date" placeholder="Close date"
              value={form.close_date} onChange={e => setForm(f => ({ ...f, close_date: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="col-span-2 flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Deal'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-gray-500 px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {DEAL_STAGES.map(stage => {
          const colDeals = byStage(stage.value)
          const isOver = dragOver === stage.value
          return (
            <div
              key={stage.value}
              onDragOver={e => { e.preventDefault(); setDragOver(stage.value) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => onDrop(stage.value)}
              className={`flex-shrink-0 w-52 rounded-xl border-2 transition-colors ${isOver ? 'border-indigo-400 bg-indigo-50' : `border-transparent ${stage.bg}`}`}
            >
              {/* Column header */}
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-bold uppercase tracking-wider ${stage.color}`}>{stage.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.bg} ${stage.color} border ${stage.color.replace('text-', 'border-').replace('-700','-200').replace('-600','-200')}`}>
                    {colDeals.length}
                  </span>
                </div>
                <p className={`text-xs font-semibold ${stage.color} opacity-80`}>{formatCurrency(stageValue(stage.value))}</p>
              </div>

              {/* Drop hint */}
              {isOver && (
                <div className="mx-3 mb-2 border-2 border-dashed border-indigo-300 rounded-lg h-14 flex items-center justify-center">
                  <span className="text-xs text-indigo-400">Drop here</span>
                </div>
              )}

              {/* Cards */}
              <div className="px-3 pb-3 space-y-2 min-h-24">
                {colDeals.length === 0 && !isOver && (
                  <p className="text-xs text-gray-300 text-center py-6">No deals</p>
                )}
                {colDeals.map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => { dragging.current = deal.id }}
                    className="bg-white rounded-lg border border-gray-100 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow select-none"
                  >
                    <Link
                      href={`/crm/deals/${deal.id}`}
                      onClick={e => e.stopPropagation()}
                      className="block"
                      draggable={false}
                    >
                      <p className="text-sm font-medium text-gray-900 hover:text-indigo-600 leading-snug">{deal.title}</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">{formatCurrency(deal.value)}</p>
                    </Link>

                    {deal.contact && (
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold flex-shrink-0">
                          {deal.contact.first_name[0]}
                        </span>
                        {deal.contact.first_name} {deal.contact.last_name}
                      </p>
                    )}

                    {deal.close_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        🗓 {new Date(deal.close_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
