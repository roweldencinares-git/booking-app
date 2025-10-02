'use client'

import { useState } from 'react'

interface Booking {
  id: string
  start_time: string
  end_time: string
  client_name: string
  client_email: string
  client_phone?: string
  status: string
  notes?: string
  service_type: string
  service_duration?: number
}

interface MeetingsTableProps {
  meetings: Booking[]
  showDeleteOnly?: boolean
}

export default function MeetingsTable({ meetings, showDeleteOnly = false }: MeetingsTableProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewDetails = (meeting: Booking) => {
    setSelectedMeeting(meeting)
    setShowDetailsModal(true)
  }

  const handleCancelClick = (meeting: Booking) => {
    setSelectedMeeting(meeting)
    setShowCancelModal(true)
  }

  const handleDeleteClick = (meeting: Booking) => {
    setSelectedMeeting(meeting)
    setShowDeleteModal(true)
  }

  const handleDeleteBooking = async () => {
    if (!selectedMeeting) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/booking/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: selectedMeeting.id })
      })

      if (response.ok) {
        alert('Booking deleted successfully')
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Failed to delete booking: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Failed to delete booking')
    } finally {
      setIsLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedMeeting) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/booking/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: selectedMeeting.id })
      })

      if (response.ok) {
        alert('Booking cancelled successfully')
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Failed to cancel booking: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Failed to cancel booking')
    } finally {
      setIsLoading(false)
      setShowCancelModal(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meeting Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {meetings.map((meeting) => {
                const dateTime = formatDateTime(meeting.start_time)
                const endTime = formatDateTime(meeting.end_time)

                return (
                  <tr key={meeting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {meeting.service_type}
                        </div>
                        <div className="text-sm text-gray-500">
                          {meeting.service_duration || 30} minutes
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {meeting.client_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {meeting.client_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {dateTime.date}
                        </div>
                        <div className="text-sm text-gray-500">
                          {dateTime.time} - {endTime.time}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {showDeleteOnly ? (
                          <>
                            <button
                              onClick={() => handleViewDetails(meeting)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteClick(meeting)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleViewDetails(meeting)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </button>
                            <a
                              href={`/admin/meetings/${meeting.id}/reschedule`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Reschedule
                            </a>
                            <button
                              onClick={() => handleCancelClick(meeting)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteClick(meeting)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Service</label>
                <p className="text-lg text-gray-900">{selectedMeeting.service_type}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Client Name</label>
                  <p className="text-lg text-gray-900">{selectedMeeting.client_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg text-gray-900">{selectedMeeting.client_email}</p>
                </div>
              </div>

              {selectedMeeting.client_phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg text-gray-900">{selectedMeeting.client_phone}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Time</label>
                  <p className="text-lg text-gray-900">
                    {formatDateTime(selectedMeeting.start_time).date} at {formatDateTime(selectedMeeting.start_time).time}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Time</label>
                  <p className="text-lg text-gray-900">
                    {formatDateTime(selectedMeeting.end_time).time}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Duration</label>
                <p className="text-lg text-gray-900">{selectedMeeting.service_duration || 30} minutes</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p>
                  <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedMeeting.status)}`}>
                    {selectedMeeting.status}
                  </span>
                </p>
              </div>

              {selectedMeeting.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-900">{selectedMeeting.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cancel Booking?</h2>

            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel the booking with <strong>{selectedMeeting.client_name}</strong> on{' '}
              {formatDateTime(selectedMeeting.start_time).date} at {formatDateTime(selectedMeeting.start_time).time}?
            </p>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                No, Keep It
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {isLoading ? 'Cancelling...' : 'Yes, Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-red-900 mb-4">⚠️ Delete Booking Permanently?</h2>

            <p className="text-gray-600 mb-4">
              Are you sure you want to <strong className="text-red-600">permanently delete</strong> the booking with <strong>{selectedMeeting.client_name}</strong>?
            </p>

            <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. The booking will be completely removed from the database.
              </p>
            </div>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                No, Keep It
              </button>
              <button
                onClick={handleDeleteBooking}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
