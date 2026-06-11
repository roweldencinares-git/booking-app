'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { CrmCompany } from '@/lib/crm-types'
import TagInput from '@/components/crm/TagInput'

export default function NewContactPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<CrmCompany[]>([])
  const [saving, setSaving] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    company_id: '', type: 'lead', notes: ''
  })

  useEffect(() => {
    fetch('/api/crm/companies').then(r => r.json()).then(d => setCompanies(Array.isArray(d) ? d : []))
  }, [])

  const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = { ...form, tags, company_id: form.company_id || null }
    const res = await fetch('/api/crm/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      const c = await res.json()
      router.push(`/crm/contacts/${c.id}`)
    } else {
      setSaving(false)
      alert('Failed to save contact')
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-3">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">New Contact</h1>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input required value={form.first_name} onChange={e => set('first_name', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input required value={form.last_name} onChange={e => set('last_name', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <select value={form.company_id} onChange={e => set('company_id', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">None</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="lead">Lead</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <TagInput tags={tags} onChange={setTags} placeholder="Type tag and press Enter..." />
          <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add a tag</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Contact'}
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
