'use client'

import { useState } from 'react'

interface Session {
  id: string
  date: string
  notes: string
  duration: number
  rating: number
}

interface SessionHistoryModalProps {
  clientName: string
  sessions: Session[]
  isOpen: boolean
  onClose: () => void
}

export default function SessionHistoryModal({
  clientName,
  sessions,
  isOpen,
  onClose
}: SessionHistoryModalProps) {
  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const totalSessions = sessions.length
  const avgRating = sessions.reduce((sum, s) => sum + s.rating, 0) / totalSessions
  const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0) / 60

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-teal to-primary-blue p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">{clientName}</h2>
              <p className="text-blue-100">Session History & Notes</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white bg-opacity-20 rounded p-3">
              <div className="text-xs text-blue-100">Total Sessions</div>
              <div className="text-2xl font-bold">{totalSessions}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded p-3">
              <div className="text-xs text-blue-100">Avg Rating</div>
              <div className="text-2xl font-bold">{avgRating.toFixed(1)} ⭐</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded p-3">
              <div className="text-xs text-blue-100">Total Hours</div>
              <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="p-6 overflow-y-auto max-h-96">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Sessions</h3>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-teal transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(session.date)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session.duration} minutes
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={i < session.rating ? 'text-yellow-400' : 'text-gray-300'}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{session.notes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-primary-blue text-white px-6 py-2 rounded-lg hover:bg-primary-teal transition-colors w-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
