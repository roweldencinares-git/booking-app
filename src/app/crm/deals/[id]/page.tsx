'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DEAL_STAGES, ACTIVITY_EMOJI, formatCurrency, type CrmDeal, type CrmActivity } from '@/lib/crm-types'

interface DealDetail extends CrmDeal {
  activities: CrmActivity[]
}

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [deal, setDeal] = useState<DealDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activityContent, setActivityContent] = useState('')
  const [activityType, setActivityType] = useState<'note' | 'call' | 'email' | 'meeting'>('note')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [dealData, activities] = await Promise.all([
      fetch(`/api/crm/deals/${id}`).then(r => r.json()).catch(() => null),
      fetch(`/api/crm/activities?deal_id=${id}`).then(r => r.json()).catch(() => []),
    ])
    if (dealData) setDeal({ ...dealData, activities: Array.isArray(activities) ? activities : [] })
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const logActivity = async () => {
    if (!activityContent.trim()) return
    setSaving(true)
    await fetch('/api/crm/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activityType, content: activityContent, deal_id: id })
    })
    setActivityContent('')
    setSaving(false)
    load()
  }

  const deleteDeal = async () => {
    if (!confirm('Delete this deal?')) return
    await fetch(`/api/crm/deals/${id}`, { method: 'DELETE' })
    router.push('/crm/deals')
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (!deal) return <div className="p-8 text-gray-400">Deal not found</div>

  const stage = DEAL_STAGES.find(s => s.value === deal.stage)

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Deals</button>
        <Link href={`/crm/deals/${id}/edit`} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">
          Edit
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h1 className="text-lg font-bold text-gray-900 mb-1">{deal.title}</h1>
            <p className="text-2xl font-bold text-indigo-600 mb-3">{formatCurrency(deal.value)}</p>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${stage?.bg} ${stage?.color}`}>{stage?.label}</span>

            {deal.contact && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Contact</p>
                <Link href={`/crm/contacts/${deal.contact.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                  {deal.contact.first_name} {deal.contact.last_name}
                </Link>
              </div>
            )}

            {deal.close_date && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Close Date</p>
                <p className="text-sm text-gray-900">{new Date(deal.close_date).toLocaleDateString()}</p>
              </div>
            )}

            {deal.description && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700">{deal.description}</p>
              </div>
            )}
          </div>

          <button onClick={deleteDeal} className="w-full text-sm text-red-500 py-2 border border-red-200 rounded-lg hover:bg-red-50">
            Delete Deal
          </button>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex gap-2 mb-3">
              {(['note', 'call', 'email', 'meeting'] as const).map(t => (
                <button key={t} onClick={() => setActivityType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${activityType === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {ACTIVITY_EMOJI[t]} {t}
                </button>
              ))}
            </div>
            <textarea rows={2} value={activityContent} onChange={e => setActivityContent(e.target.value)}
              placeholder={`Log a ${activityType}...`}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <button onClick={logActivity} disabled={saving || !activityContent.trim()}
              className="mt-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Log'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-sm text-gray-900 mb-4">Activity</h3>
            {deal.activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activities yet</p>
            ) : (
              <div className="space-y-4">
                {deal.activities.map(a => (
                  <div key={a.id} className="flex gap-3">
                    <span className="text-lg">{ACTIVITY_EMOJI[a.type as keyof typeof ACTIVITY_EMOJI]}</span>
                    <div>
                      <p className="text-sm text-gray-900">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
