import Link from 'next/link'
import { Client } from '@/lib/coachDashboardService'

interface ClientCardProps {
  client: Client
}

export default function ClientCard({ client }: ClientCardProps) {
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

  return (
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
        <Link
          href={`/admin/coach-dashboard/notes/${client.id}`}
          className="flex-1 bg-primary-blue text-white px-4 py-2 rounded-lg text-center text-sm font-medium hover:bg-primary-teal transition-colors"
        >
          View Notes
        </Link>
        <Link
          href={`/admin/meetings?client=${client.id}`}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Sessions
        </Link>
      </div>
    </div>
  )
}
