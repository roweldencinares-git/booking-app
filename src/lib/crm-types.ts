export type ContactType = 'lead' | 'customer' | 'partner'
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type ActivityType = 'note' | 'call' | 'email' | 'meeting'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface CrmCompany {
  id: string
  name: string
  website?: string
  industry?: string
  size?: string
  created_at: string
  updated_at: string
}

export interface CrmContact {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company_id?: string
  company?: CrmCompany
  type: ContactType
  status: 'active' | 'inactive'
  tags: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface CrmDeal {
  id: string
  title: string
  value: number
  stage: DealStage
  contact_id?: string
  contact?: CrmContact
  company_id?: string
  company?: CrmCompany
  close_date?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface CrmActivity {
  id: string
  type: ActivityType
  content: string
  contact_id?: string
  deal_id?: string
  created_at: string
}

export interface CrmTask {
  id: string
  title: string
  due_date?: string
  priority: TaskPriority
  completed: boolean
  contact_id?: string
  contact?: CrmContact
  deal_id?: string
  deal?: CrmDeal
  created_at: string
  updated_at: string
}

export const DEAL_STAGES: { value: DealStage; label: string; color: string; bg: string }[] = [
  { value: 'lead', label: 'Lead', color: 'text-gray-700', bg: 'bg-gray-100' },
  { value: 'qualified', label: 'Qualified', color: 'text-blue-700', bg: 'bg-blue-100' },
  { value: 'proposal', label: 'Proposal', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  { value: 'negotiation', label: 'Negotiation', color: 'text-orange-700', bg: 'bg-orange-100' },
  { value: 'won', label: 'Won', color: 'text-green-700', bg: 'bg-green-100' },
  { value: 'lost', label: 'Lost', color: 'text-red-700', bg: 'bg-red-100' },
]

export const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

export const ACTIVITY_EMOJI: Record<ActivityType, string> = {
  note: '📝',
  call: '📞',
  email: '✉️',
  meeting: '🤝',
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value)
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}
