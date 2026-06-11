'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DEAL_STAGES, type CrmDeal, type DealStage } from '@/lib/crm-types'

export default function EditDealPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    title: '', value: '', stage: 'lead' as DealStage,
    contact_id: '', company_id: '', close_date: '', description: ''
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/crm/deals/${id}`).then(r => r.json()),
      fetch('/api/crm/contacts').then(r => r.json()),
      fetch('/api/crm/companies').then(r => r.json()),
    ]).then(([deal, cons, cos]: [CrmDeal, any[], any[]]) => {
      setForm({
        title: deal.title || '',
        value: String(deal.value || ''),
        stage: deal.stage || 'lead',
        contact_id: deal.contact_id || '',
        company_id: deal.company_id || '',
        close_date: deal.close_date ? deal.close_date.split('T')[0] : '',
        description: deal.description || '',
      })
      setContacts(Array.isArray(cons) ? cons : [])
      setCompanies(Array.isArray(cos) ? cos : [])
      setLoading(false)
    })
  }, [id])

  const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = {
      ...form,
      value: parseFloat(form.value) || 0,
      contact_id: form.contact_id || null,
      company_id: form.company_id || null,
      close_date: form.close_date || null,
    }
    const res = await fetch(`/api/crm/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      router.push(`/crm/deals/${id}`)
    } else {
      setSaving(false)
      alert('Failed to save')
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-3">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Deal</h1>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deal Title *</label>
          <input required value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value ($)</label>
            <input type="number" value={form.value} onChange={e => set('value', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select value={form.stage} onChange={e => set('stage', e.target.value as DealStage)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {DEAL_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <select value={form.contact_id} onChange={e => set('contact_id', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">None</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <select value={form.company_id} onChange={e => set('company_id', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">None</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Close Date</label>
          <input type="date" value={form.close_date} onChange={e => set('close_date', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="text-gray-500 px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
