'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency, DEAL_STAGES } from '@/lib/crm-types'

interface ReportData {
  deals: { total: number; won: number; lost: number; open: number; winRate: number; pipelineValue: number; wonValue: number; avgDealSize: number }
  byStage: { stage: string; count: number; value: number }[]
  monthly: { label: string; count: number; value: number }[]
  contacts: { total: number; lead: number; customer: number; partner: number }
  topTags: { tag: string; count: number }[]
  activityByType: { note: number; call: number; email: number; meeting: number }
  tasks: { total: number; completed: number; overdue: number; high: number }
  topDeals: { id: string; title: string; value: number; stage: string }[]
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/crm/reports').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (!data) return <div className="p-8 text-gray-400">No data</div>

  const maxMonthlyValue = Math.max(...data.monthly.map(m => m.value), 1)
  const maxStageCount = Math.max(...data.byStage.map(s => s.count), 1)
  const totalActivity = Object.values(data.activityByType).reduce((a, b) => a + b, 0)

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Business performance at a glance</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Win Rate', value: `${data.deals.winRate}%`, sub: `${data.deals.won} won / ${data.deals.won + data.deals.lost} closed`, color: 'text-green-600' },
          { label: 'Revenue Closed', value: formatCurrency(data.deals.wonValue), sub: `${data.deals.won} deals`, color: 'text-indigo-600' },
          { label: 'Pipeline Value', value: formatCurrency(data.deals.pipelineValue), sub: `${data.deals.open} open deals`, color: 'text-blue-600' },
          { label: 'Avg Deal Size', value: formatCurrency(data.deals.avgDealSize), sub: 'closed won only', color: 'text-purple-600' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Monthly revenue (last 6 months) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Monthly Closed Revenue</h2>
          <div className="space-y-3">
            {data.monthly.map(m => (
              <div key={m.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14 flex-shrink-0">{m.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${Math.max((m.value / maxMonthlyValue) * 100, m.count > 0 ? 4 : 0)}%` }}
                  >
                    {m.value > 0 && <span className="text-white text-xs font-medium">{m.count}</span>}
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700 w-20 text-right flex-shrink-0">
                  {m.value > 0 ? formatCurrency(m.value) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deal pipeline by stage */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Pipeline by Stage</h2>
          <div className="space-y-3">
            {data.byStage.map(s => {
              const stage = DEAL_STAGES.find(ds => ds.value === s.stage)
              return (
                <div key={s.stage} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-24 text-center flex-shrink-0 ${stage?.bg} ${stage?.color}`}>{stage?.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all"
                      style={{ width: `${Math.max((s.count / maxStageCount) * 100, s.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right flex-shrink-0">
                    {s.count} · {s.value > 0 ? formatCurrency(s.value) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Contact breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Contacts ({data.contacts.total})</h2>
          <div className="space-y-3">
            {[
              { label: 'Customers', count: data.contacts.customer, color: 'bg-green-500' },
              { label: 'Leads', count: data.contacts.lead, color: 'bg-blue-500' },
              { label: 'Partners', count: data.contacts.partner, color: 'bg-purple-500' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                <span className="text-sm text-gray-700 flex-1">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
                <span className="text-xs text-gray-400">
                  {data.contacts.total > 0 ? `${Math.round((count / data.contacts.total) * 100)}%` : '0%'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Activities ({totalActivity})</h2>
          <div className="space-y-3">
            {[
              { label: 'Notes', count: data.activityByType.note, emoji: '📝' },
              { label: 'Calls', count: data.activityByType.call, emoji: '📞' },
              { label: 'Emails', count: data.activityByType.email, emoji: '✉️' },
              { label: 'Meetings', count: data.activityByType.meeting, emoji: '🤝' },
            ].map(({ label, count, emoji }) => (
              <div key={label} className="flex items-center gap-2">
                <span>{emoji}</span>
                <span className="text-sm text-gray-700 flex-1">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Tasks ({data.tasks.total})</h2>
          <div className="space-y-3">
            {[
              { label: 'Completed', count: data.tasks.completed, color: 'text-green-600' },
              { label: 'Open', count: data.tasks.total - data.tasks.completed, color: 'text-gray-700' },
              { label: 'Overdue', count: data.tasks.overdue, color: 'text-red-600' },
              { label: 'High priority', count: data.tasks.high, color: 'text-orange-600' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`text-sm flex-1 ${color}`}>{label}</span>
                <span className={`text-sm font-semibold ${color}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top deals */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Top Deals by Value</h2>
          {data.topDeals.length === 0 ? (
            <p className="text-sm text-gray-400">No deals yet</p>
          ) : (
            <div className="space-y-2">
              {data.topDeals.map((deal, i) => {
                const stage = DEAL_STAGES.find(s => s.value === deal.stage)
                return (
                  <Link key={deal.id} href={`/crm/deals/${deal.id}`} className="flex items-center gap-3 py-1.5 hover:bg-gray-50 rounded-lg px-1 -mx-1">
                    <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                    <span className="text-sm text-gray-900 flex-1 truncate">{deal.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${stage?.bg} ${stage?.color}`}>{stage?.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(deal.value)}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Top tags */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Top Tags</h2>
          {data.topTags.length === 0 ? (
            <p className="text-sm text-gray-400">No tags yet — add tags to contacts to see them here</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.topTags.map(({ tag, count }) => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm">
                  {tag}
                  <span className="text-xs bg-indigo-100 text-indigo-600 rounded-full px-1.5">{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
