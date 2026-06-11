'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DEAL_STAGES, formatCurrency, type CrmDeal, type DealStage } from '@/lib/crm-types'

export default function DealsPage() {
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', value: '', stage: 'lead' as DealStage, contact_id: '', close_date: '' })
  const [contacts, setContacts] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [saving, setSaving] = useState(false)

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
    const body = { ...form, value: parseFloat(form.value) || 0, contact_id: form.contact_id || null, close_date: form.close_date || null }
    const res = await fetch('/api/crm/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { setShowForm(false); setForm({ title: '', value: '', stage: 'lead', contact_id: '', close_date: '' }); load() }
    setSaving(false)
  }

  const updateStage = async (id: string, stage: DealStage) => {
    await fetch(`/api/crm/deals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }) })
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-500 mt-1">{deals.filter(d => !['won','lost'].includes(d.stage)).length} open · {formatCurrency(deals.filter(d => !['won','lost'].includes(d.stage)).reduce((s,d)=>s+d.value,0))} pipeline</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          + New Deal
        </button>
      </div>

      {/* New deal form */}
      {showForm && (
        <form onSubmit={saveDeal} className="bg-white rounded-xl border border-indigo-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Deal</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input required placeholder="Deal title *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="number" placeholder="Value ($)" value={form.value} onChange={e => setForm(f => ({...f, value: e.target.value}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={form.stage} onChange={e => setForm(f => ({...f, stage: e.target.value as DealStage}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {DEAL_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={form.contact_id} onChange={e => setForm(f => ({...f, contact_id: e.target.value}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">No contact</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
            <input type="date" placeholder="Close date" value={form.close_date} onChange={e => setForm(f => ({...f, close_date: e.target.value}))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Deal'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
        {DEAL_STAGES.map(stage => (
          <div key={stage.value} className="min-w-[180px]">
            <div className={`rounded-t-lg px-3 py-2 ${stage.bg}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${stage.color}`}>{stage.label}</p>
              <p className={`text-xs ${stage.color} opacity-75`}>{byStage(stage.value).length} · {formatCurrency(stageValue(stage.value))}</p>
            </div>
            <div className="bg-gray-100 rounded-b-lg p-2 min-h-[200px] space-y-2">
              {byStage(stage.value).map(deal => (
                <div key={deal.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <Link href={`/crm/deals/${deal.id}`} className="block">
                    <p className="text-sm font-medium text-gray-900 hover:text-indigo-600">{deal.title}</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">{formatCurrency(deal.value)}</p>
                    {deal.contact && (
                      <p className="text-xs text-gray-400 mt-1">{deal.contact.first_name} {deal.contact.last_name}</p>
                    )}
                  </Link>
                  {/* Quick move */}
                  <select
                    value={deal.stage}
                    onChange={e => updateStage(deal.id, e.target.value as DealStage)}
                    className="mt-2 w-full text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-500 focus:outline-none"
                  >
                    {DEAL_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
