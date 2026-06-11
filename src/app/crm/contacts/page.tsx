'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getInitials, type CrmContact } from '@/lib/crm-types'

export default function ContactsPage() {
  const [allContacts, setAllContacts] = useState<CrmContact[]>([])
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [q, setQ] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async (search = '') => {
    setLoading(true)
    const url = search ? `/api/crm/contacts?q=${encodeURIComponent(search)}` : '/api/crm/contacts'
    const data = await fetch(url).then(r => r.json())
    const list = Array.isArray(data) ? data : []
    setAllContacts(list)
    setContacts(list)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(() => load(q), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (!tagFilter) { setContacts(allContacts); return }
    setContacts(allContacts.filter(c => (c.tags || []).includes(tagFilter)))
  }, [tagFilter, allContacts])

  // Collect all unique tags
  const allTags = Array.from(new Set(allContacts.flatMap(c => c.tags || []))).sort()

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 mt-1">{contacts.length} total</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/contacts/import" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            ↑ Import CSV
          </Link>
          <Link href="/crm/contacts/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            + New Contact
          </Link>
        </div>
      </div>

      {/* Search + tag filter */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {allTags.length > 0 && (
          <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">All tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>
      {tagFilter && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">Filtered by tag:</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">{tagFilter}</span>
          <button onClick={() => setTagFilter('')} className="text-xs text-gray-400 hover:text-gray-600">Clear ×</button>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : contacts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-3">No contacts found</p>
          <Link href="/crm/contacts/new" className="text-indigo-600 text-sm hover:underline">Add your first contact</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/crm/contacts/${c.id}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {getInitials(c.first_name, c.last_name)}
                      </div>
                      <span className="font-medium text-gray-900 group-hover:text-indigo-600">{c.first_name} {c.last_name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.company?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                      c.type === 'customer' ? 'bg-green-100 text-green-700' :
                      c.type === 'partner' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{c.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags || []).slice(0, 3).map(t => (
                        <button key={t} onClick={() => setTagFilter(t)} className="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs hover:bg-indigo-100">{t}</button>
                      ))}
                      {(c.tags || []).length > 3 && <span className="text-xs text-gray-400">+{c.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/crm/contacts/${c.id}/edit`} className="text-xs text-indigo-600 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
