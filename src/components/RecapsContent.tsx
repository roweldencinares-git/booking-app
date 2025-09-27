'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Meeting {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
  service_type: string
  notes?: string
}

interface Stats {
  totalSessions: number
  thisMonthSessions: number
  totalHours: number
}

interface RecapsContentProps {
  meetings: Meeting[]
  stats: Stats
}

export default function RecapsContent({ meetings, stats }: RecapsContentProps) {
  const [activeView, setActiveView] = useState<'overview' | 'sessions' | 'analytics'>('overview')
  const [showFathomEmbed, setShowFathomEmbed] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getSessionDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60)
    return `${Math.round(duration)} min`
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Session Recaps</h1>
        <p className="text-gray-600 mt-2">Review your coaching journey and progress</p>
      </div>

      {/* View Toggle */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveView('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('sessions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Session History
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">📅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisMonthSessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-xl">⏱️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sessions Summary */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Sessions</h2>
            </div>
            <div className="p-6">
              {meetings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📊</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed sessions yet</h3>
                  <p className="text-gray-600 mb-4">Your session recaps will appear here after you complete your first coaching session.</p>
                  <Link
                    href="/book"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book Your First Session
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.slice(0, 5).map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {meeting.title || meeting.service_type}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(meeting.start_time)} • {formatTime(meeting.start_time)} • {getSessionDuration(meeting.start_time, meeting.end_time)}
                        </p>
                        {meeting.notes && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{meeting.notes}</p>
                        )}
                      </div>
                      <button className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeView === 'sessions' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Completed Sessions</h2>
          </div>
          <div className="p-6">
            {meetings.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-gray-400 text-4xl">📊</span>
                <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No sessions completed yet</h3>
                <p className="text-gray-600">Your completed sessions will be listed here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {meeting.title || meeting.service_type}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Date:</span> {formatDate(meeting.start_time)}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {getSessionDuration(meeting.start_time, meeting.end_time)}
                          </div>
                        </div>
                        {meeting.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Notes:</span>
                            <p className="text-sm text-gray-600 mt-1">{meeting.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeView === 'analytics' && (
        <div className="space-y-6">
          {/* Fathom Integration Toggle */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Advanced Analytics</h2>
                <p className="text-gray-600 mt-1">Get detailed insights into your coaching progress</p>
              </div>
              <button
                onClick={() => setShowFathomEmbed(!showFathomEmbed)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showFathomEmbed
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showFathomEmbed ? 'Hide' : 'Show'} Fathom Analytics
              </button>
            </div>

            {/* Fathom Embed Area */}
            {showFathomEmbed && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="mb-4">
                  <span className="text-gray-400 text-4xl">📊</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fathom Analytics Integration</h3>
                <p className="text-gray-600 mb-4">
                  This is where your Fathom analytics dashboard will be embedded.
                  Configure your Fathom site ID and embed code to display advanced analytics.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Integration Steps:</h4>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Get your Fathom site ID from your Fathom dashboard</li>
                    <li>2. Configure the embed script in your environment variables</li>
                    <li>3. Add your Fathom tracking code to track booking events</li>
                    <li>4. Enable embed mode in your Fathom settings</li>
                  </ol>
                </div>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Configure Fathom Integration
                </button>
              </div>
            )}
          </div>

          {/* Built-in Analytics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Monthly Progress</h4>
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => {
                    const month = new Date()
                    month.setMonth(month.getMonth() - i)
                    const monthName = month.toLocaleDateString('en-US', { month: 'short' })
                    const sessions = Math.max(0, stats.thisMonthSessions - i * 2)

                    return (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{monthName}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (sessions / 10) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{sessions}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Session Types</h4>
                <div className="space-y-2">
                  {Array.from(new Set(meetings.map(m => m.service_type))).map((type, i) => {
                    const count = meetings.filter(m => m.service_type === type).length
                    const percentage = meetings.length > 0 ? (count / meetings.length) * 100 : 0

                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}