'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getInitials, ACTIVITY_EMOJI, PRIORITY_BADGE, formatCurrency, DEAL_STAGES, type CrmContact, type CrmActivity, type CrmDeal, type CrmTask } from '@/lib/crm-types'

interface ContactDetail extends CrmContact {
  deals: CrmDeal[]
  activities: CrmActivity[]
  tasks: CrmTask[]
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activityType, setActivityType] = useState<'note' | 'call' | 'email' | 'meeting'>('note')
  const [activityContent, setActivityContent] = useState('')
  const [savingActivity, setSavingActivity] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' })
  const [sendingEmail, setSendingEmail] = useState(false)

  const load = async () => {
    const data = await fetch(`/api/crm/contacts/${id}`).then(r => r.json())
    setContact(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const addActivity = async () => {
    if (!activityContent.trim()) return
    setSavingActivity(true)
    await fetch('/api/crm/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activityType, content: activityContent, contact_id: id })
    })
    setActivityContent('')
    setSavingActivity(false)
    load()
  }

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact?.email) return
    setSendingEmail(true)
    const res = await fetch('/api/crm/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: contact.email, subject: emailForm.subject, body: emailForm.body, contact_id: id }),
    })
    if (res.ok) {
      setShowEmail(false)
      setEmailForm({ subject: '', body: '' })
      load()
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to send email')
    }
    setSendingEmail(false)
  }

  const deleteContact = async () => {
    if (!confirm('Delete this contact? This cannot be undone.')) return
    await fetch(`/api/crm/contacts/${id}`, { method: 'DELETE' })
    router.push('/crm/contacts')
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (!contact) return <div className="p-8 text-gray-400">Contact not found</div>

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Contacts</button>
        <div className="flex gap-2">
          {contact.email && (
            <button onClick={() => setShowEmail(!showEmail)} className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700">
              ✉️ Email
            </button>
          )}
          <Link href={`/crm/contacts/${id}/edit`} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">
            Edit
          </Link>
        </div>
      </div>

      {/* Email compose */}
      {showEmail && (
        <form onSubmit={sendEmail} className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Send Email to {contact.email}</h3>
          <input required placeholder="Subject" value={emailForm.subject} onChange={e => setEmailForm(f => ({...f, subject: e.target.value}))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <textarea required rows={4} placeholder="Message..." value={emailForm.body} onChange={e => setEmailForm(f => ({...f, body: e.target.value}))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          <div className="flex gap-2">
            <button type="submit" disabled={sendingEmail} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {sendingEmail ? 'Sending...' : 'Send & Log'}
            </button>
            <button type="button" onClick={() => setShowEmail(false)} className="text-gray-500 px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Contact card */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center mb-3">
                {getInitials(contact.first_name, contact.last_name)}
              </div>
              <h1 className="text-lg font-bold text-gray-900">{contact.first_name} {contact.last_name}</h1>
              {contact.company && <p className="text-sm text-gray-500">{contact.company.name}</p>}
              <span className={`mt-2 text-xs px-2 py-1 rounded-full font-medium capitalize ${
                contact.type === 'customer' ? 'bg-green-100 text-green-700' :
                contact.type === 'partner' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-600'
              }`}>{contact.type}</span>
            </div>

            <div className="space-y-2 text-sm">
              {contact.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span>✉️</span> <a href={`mailto:${contact.email}`} className="hover:text-indigo-600">{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span>📞</span> <a href={`tel:${contact.phone}`} className="hover:text-indigo-600">{contact.phone}</a>
                </div>
              )}
            </div>

            {contact.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {contact.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">{tag}</span>
                ))}
              </div>
            )}

            {contact.notes && (
              <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">{contact.notes}</p>
            )}
          </div>

          {/* Deals */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Deals ({contact.deals?.length || 0})</h3>
            {contact.deals?.length === 0 ? (
              <p className="text-xs text-gray-400">No deals</p>
            ) : (
              <div className="space-y-2">
                {contact.deals?.map(deal => {
                  const stage = DEAL_STAGES.find(s => s.value === deal.stage)
                  return (
                    <Link key={deal.id} href={`/crm/deals/${deal.id}`} className="block p-2 rounded-lg hover:bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${stage?.bg} ${stage?.color}`}>{stage?.label}</span>
                        <span className="text-xs text-gray-500">{formatCurrency(deal.value)}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <button onClick={deleteContact} className="w-full text-sm text-red-500 hover:text-red-700 py-2 border border-red-200 rounded-lg hover:bg-red-50">
            Delete Contact
          </button>
        </div>

        {/* Right: Activity feed */}
        <div className="md:col-span-2 space-y-4">
          {/* Add activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex gap-2 mb-3">
              {(['note', 'call', 'email', 'meeting'] as const).map(t => (
                <button key={t} onClick={() => setActivityType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors capitalize ${activityType === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {ACTIVITY_EMOJI[t]} {t}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={activityContent}
              onChange={e => setActivityContent(e.target.value)}
              placeholder={`Log a ${activityType}...`}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button onClick={addActivity} disabled={savingActivity || !activityContent.trim()}
              className="mt-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {savingActivity ? 'Saving...' : 'Log Activity'}
            </button>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Activity Timeline</h3>
            {contact.activities?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activities yet — log your first interaction above</p>
            ) : (
              <div className="space-y-4">
                {contact.activities?.map(a => (
                  <div key={a.id} className="flex gap-3">
                    <span className="text-lg mt-0.5">{ACTIVITY_EMOJI[a.type as keyof typeof ACTIVITY_EMOJI]}</span>
                    <div>
                      <p className="text-sm text-gray-900">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(a.created_at).toLocaleDateString()} {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          {contact.tasks?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Tasks</h3>
              <div className="space-y-2">
                {contact.tasks?.map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span>
                    <span className={`text-sm ${t.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title}</span>
                    {t.due_date && <span className="text-xs text-gray-400 ml-auto">{new Date(t.due_date).toLocaleDateString()}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
