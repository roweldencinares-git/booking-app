'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DEAL_STAGES, formatCurrency, type CrmDeal, type CrmTask, type CrmContact } from '@/lib/crm-types'

interface Stats {
  contacts: number
  openDeals: number
  pipelineValue: number
  tasksDue: number
}

export default function CrmDashboard() {
  const [stats, setStats] = useState<Stats>({ contacts: 0, openDeals: 0, pipelineValue: 0, tasksDue: 0 })
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [tasks, setTasks] = useState<CrmTask[]>([])
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ created: number; updated: number; skipped: number } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/crm/contacts').then(r => r.json()),
      fetch('/api/crm/deals').then(r => r.json()),
      fetch('/api/crm/tasks?completed=false').then(r => r.json()),
    ]).then(([c, d, t]) => {
      const contactList: CrmContact[] = Array.isArray(c) ? c : []
      const dealList: CrmDeal[] = Array.isArray(d) ? d : []
      const taskList: CrmTask[] = Array.isArray(t) ? t : []

      const openDeals = dealList.filter(d => !['won', 'lost'].includes(d.stage))
      const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0)
      const now = new Date()
      const tasksDue = taskList.filter(t => t.due_date && new Date(t.due_date) <= now).length

      setStats({ contacts: contactList.length, openDeals: openDeals.length, pipelineValue, tasksDue })
      setDeals(dealList.slice(0, 5))
      setTasks(taskList.slice(0, 5))
      setContacts(contactList.slice(0, 5))
      setLoading(false)
    })
  }, [])

  const syncBookings = async () => {
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch('/api/crm/sync/bookings', { method: 'POST' })
    const data = await res.json()
    setSyncResult(data)
    setSyncing(false)
    // Reload stats after sync
    const c = await fetch('/api/crm/contacts').then(r => r.json())
    if (Array.isArray(c)) setContacts(c.slice(0, 5))
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Your pipeline at a glance</p>
        </div>
        <div className="text-right">
          <button onClick={syncBookings} disabled={syncing}
            className="text-sm bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50">
            {syncing ? '⏳ Syncing...' : '🔄 Sync from Bookings'}
          </button>
          {syncResult && (
            <p className="text-xs text-gray-500 mt-1">
              +{syncResult.created} new · {syncResult.updated} updated · {syncResult.skipped} skipped
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Contacts', value: stats.contacts, href: '/crm/contacts', color: 'text-indigo-600' },
          { label: 'Open Deals', value: stats.openDeals, href: '/crm/deals', color: 'text-blue-600' },
          { label: 'Pipeline', value: formatCurrency(stats.pipelineValue), href: '/crm/deals', color: 'text-green-600' },
          { label: 'Tasks Due', value: stats.tasksDue, href: '/crm/tasks', color: stats.tasksDue > 0 ? 'text-red-600' : 'text-gray-600' },
        ].map(({ label, value, href, color }) => (
          <Link key={label} href={href} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Deals */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Deals</h2>
            <Link href="/crm/deals" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {deals.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No deals yet — <Link href="/crm/deals" className="text-indigo-600 hover:underline">add your first</Link></p>
          ) : (
            <div className="space-y-3">
              {deals.map(deal => {
                const stage = DEAL_STAGES.find(s => s.value === deal.stage)
                return (
                  <div key={deal.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                      {deal.contact && (
                        <p className="text-xs text-gray-400">{deal.contact.first_name} {deal.contact.last_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(deal.value)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stage?.bg} ${stage?.color}`}>{stage?.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tasks Due */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Tasks</h2>
            <Link href="/crm/tasks" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">All clear!</p>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => {
                const overdue = task.due_date && new Date(task.due_date) < new Date()
                return (
                  <div key={task.id} className="flex items-start gap-2 py-1.5">
                    <span className="mt-0.5 text-gray-300">○</span>
                    <div>
                      <p className="text-sm text-gray-900">{task.title}</p>
                      {task.due_date && (
                        <p className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          {overdue ? '⚠ ' : ''}
                          {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Contacts */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Contacts</h2>
          <Link href="/crm/contacts/new" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">+ Add Contact</Link>
        </div>
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No contacts yet</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {contacts.map(c => (
              <Link key={c.id} href={`/crm/contacts/${c.id}`} className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center mb-2">
                  {c.first_name[0]}{c.last_name[0]}
                </div>
                <p className="text-xs font-medium text-gray-900 truncate w-full">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-gray-400 truncate w-full">{c.email || c.type}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
