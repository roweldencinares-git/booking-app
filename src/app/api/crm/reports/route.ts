import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [dealsRes, contactsRes, tasksRes, activitiesRes] = await Promise.all([
    supabase.from('crm_deals').select('id, title, value, stage, created_at, close_date'),
    supabase.from('crm_contacts').select('id, type, created_at, tags'),
    supabase.from('crm_tasks').select('id, completed, priority, due_date'),
    supabase.from('crm_activities').select('id, type, created_at'),
  ])

  const deals = dealsRes.data || []
  const contacts = contactsRes.data || []
  const tasks = tasksRes.data || []
  const activities = activitiesRes.data || []

  // Deal stats
  const won = deals.filter(d => d.stage === 'won')
  const lost = deals.filter(d => d.stage === 'lost')
  const open = deals.filter(d => !['won', 'lost'].includes(d.stage))
  const totalClosed = won.length + lost.length
  const winRate = totalClosed > 0 ? Math.round((won.length / totalClosed) * 100) : 0
  const pipelineValue = open.reduce((s, d) => s + (d.value || 0), 0)
  const wonValue = won.reduce((s, d) => s + (d.value || 0), 0)
  const avgDealSize = won.length > 0 ? Math.round(wonValue / won.length) : 0

  // Stage breakdown
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
  const byStage = stages.map(stage => ({
    stage,
    count: deals.filter(d => d.stage === stage).length,
    value: deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value || 0), 0),
  }))

  // Monthly closed deals (last 6 months)
  const now = new Date()
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
    const monthDeals = won.filter(deal => {
      const dt = new Date(deal.close_date || deal.created_at)
      return dt.getFullYear() === d.getFullYear() && dt.getMonth() === d.getMonth()
    })
    return { label, count: monthDeals.length, value: monthDeals.reduce((s, d) => s + (d.value || 0), 0) }
  })

  // Contact stats
  const contactsByType = {
    lead: contacts.filter(c => c.type === 'lead').length,
    customer: contacts.filter(c => c.type === 'customer').length,
    partner: contacts.filter(c => c.type === 'partner').length,
  }

  // Top tags
  const tagCount: Record<string, number> = {}
  contacts.forEach(c => (c.tags || []).forEach((t: string) => { tagCount[t] = (tagCount[t] || 0) + 1 }))
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }))

  // Activity breakdown
  const activityByType = {
    note: activities.filter(a => a.type === 'note').length,
    call: activities.filter(a => a.type === 'call').length,
    email: activities.filter(a => a.type === 'email').length,
    meeting: activities.filter(a => a.type === 'meeting').length,
  }

  // Task stats
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    overdue: tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < now).length,
    high: tasks.filter(t => !t.completed && t.priority === 'high').length,
  }

  // Top deals by value
  const topDeals = [...deals].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5)

  return NextResponse.json({
    deals: { total: deals.length, won: won.length, lost: lost.length, open: open.length, winRate, pipelineValue, wonValue, avgDealSize },
    byStage,
    monthly,
    contacts: { total: contacts.length, ...contactsByType },
    topTags,
    activityByType,
    tasks: taskStats,
    topDeals,
  })
}
