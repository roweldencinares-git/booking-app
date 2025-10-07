'use client'

import { useState } from 'react'
import SessionHistoryModal from './SessionHistoryModal'

interface Client {
  id: string
  name: string
  email: string
  lastSessionDate: string | null
  totalSessions: number
  status: 'active' | 'inactive'
}

interface ClientCardWithHistoryProps {
  client: Client
}

// Mock session history data
const getSessionHistory = (clientId: string) => {
  const sessionData: Record<string, any[]> = {
    '1': [
      { id: '1-1', date: '2025-10-05', notes: 'Discussed work-life balance strategies. Client made significant progress with morning routine.', duration: 60, rating: 5 },
      { id: '1-2', date: '2025-09-28', notes: 'Explored stress management techniques. Introduced meditation practices.', duration: 45, rating: 4 },
      { id: '1-3', date: '2025-09-21', notes: 'Client struggling with time management. Created action plan for delegation.', duration: 60, rating: 4 },
      { id: '1-4', date: '2025-09-14', notes: 'Review of weekly goals. Strong progress on exercise routine.', duration: 45, rating: 5 },
      { id: '1-5', date: '2025-09-07', notes: 'Initial assessment - high stress levels, seeking better balance.', duration: 90, rating: 4 },
    ],
    '2': [
      { id: '2-1', date: '2025-10-03', notes: 'Career transition planning - identified 3 target companies in tech leadership.', duration: 60, rating: 5 },
      { id: '2-2', date: '2025-09-26', notes: 'Resume review and LinkedIn optimization. Client feeling more confident.', duration: 45, rating: 4 },
      { id: '2-3', date: '2025-09-19', notes: 'Interview preparation - practiced common leadership questions.', duration: 60, rating: 5 },
      { id: '2-4', date: '2025-09-12', notes: 'Discussed career values and long-term vision. Clarity emerging.', duration: 45, rating: 4 },
      { id: '2-5', date: '2025-09-05', notes: 'Initial session - exploring career change from IC to management.', duration: 60, rating: 4 },
    ],
    '3': [
      { id: '3-1', date: '2025-09-28', notes: 'Leadership team dynamics - handled conflict situation successfully.', duration: 60, rating: 5 },
      { id: '3-2', date: '2025-09-21', notes: 'Delegation framework implementation. Client delegating more effectively.', duration: 45, rating: 5 },
      { id: '3-3', date: '2025-09-14', notes: 'Performance review preparation for direct reports.', duration: 60, rating: 4 },
      { id: '3-4', date: '2025-09-07', notes: 'Communication styles workshop - adapting to different personalities.', duration: 45, rating: 5 },
      { id: '3-5', date: '2025-08-31', notes: 'Strategic thinking for Q4 planning. Great insights.', duration: 60, rating: 5 },
    ],
    '4': [
      { id: '4-1', date: '2025-09-15', notes: 'Check-in session - client requested pause for personal matters.', duration: 30, rating: 3 },
      { id: '4-2', date: '2025-09-01', notes: 'Confidence building exercises. Some progress noted.', duration: 45, rating: 3 },
      { id: '4-3', date: '2025-08-25', notes: 'Discussed imposter syndrome. Client opening up more.', duration: 60, rating: 4 },
      { id: '4-4', date: '2025-08-18', notes: 'Goal setting for professional development. Action items created.', duration: 45, rating: 3 },
      { id: '4-5', date: '2025-08-11', notes: 'Initial session - career uncertainty and lack of confidence.', duration: 60, rating: 3 },
    ],
    '5': [
      { id: '5-1', date: '2025-10-01', notes: 'Intake session - ambitious goals, strong motivation. Excellent start!', duration: 90, rating: 5 },
    ],
  }

  return sessionData[clientId] || []
}

export default function ClientCardWithHistory({ client }: ClientCardWithHistoryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No sessions yet'

    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = () => {
    if (!client.lastSessionDate) return 'bg-blue-100 text-blue-700'
    if (client.status === 'inactive') return 'bg-gray-100 text-gray-700'
    return 'bg-green-100 text-green-700'
  }

  const getStatusText = () => {
    if (!client.lastSessionDate) return 'New Client'
    if (client.status === 'inactive') return 'Inactive'
    return 'Active'
  }

  const sessions = getSessionHistory(client.id)

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Client Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-teal to-primary-blue rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {client.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
              <p className="text-sm text-gray-500">{client.email}</p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Session Info */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Last Session:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatDate(client.lastSessionDate)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Sessions:</span>
            <span className="text-sm font-medium text-gray-900">{client.totalSessions}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 bg-primary-blue text-white px-4 py-2 rounded-lg text-center text-sm font-medium hover:bg-primary-teal transition-colors"
          >
            View History
          </button>
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Schedule
          </button>
        </div>
      </div>

      <SessionHistoryModal
        clientName={client.name}
        sessions={sessions}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
