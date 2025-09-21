'use client'

import { useState } from 'react'

interface DeleteStaffModalProps {
  isOpen: boolean
  onClose: () => void
  staff: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  onDelete: (options: DeleteOptions) => Promise<void>
  availableStaff?: Array<{
    id: string
    first_name: string
    last_name: string
  }>
}

interface DeleteOptions {
  deleteFutureBookings: boolean
  transferBookingsTo: string | null
  force: boolean
}

export default function DeleteStaffModal({
  isOpen,
  onClose,
  staff,
  onDelete,
  availableStaff = []
}: DeleteStaffModalProps) {
  const [step, setStep] = useState<'confirm' | 'options' | 'processing'>('confirm')
  const [deleteOptions, setDeleteOptions] = useState<DeleteOptions>({
    deleteFutureBookings: false,
    transferBookingsTo: null,
    force: false
  })
  const [futureBookings, setFutureBookings] = useState<any[]>([])
  const [error, setError] = useState<string>('')

  const handleInitialDelete = async () => {
    setStep('processing')
    setError('')

    try {
      // First attempt - check for conflicts
      const response = await fetch(`/api/staff/${staff.id}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      })

      const data = await response.json()

      if (response.status === 409) {
        // Has future bookings - show options
        setFutureBookings(data.futureBookings || [])
        setStep('options')
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete staff member')
      }

      // Success - no conflicts
      await onDelete(deleteOptions)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStep('confirm')
    }
  }

  const handleConfirmedDelete = async () => {
    setStep('processing')
    setError('')

    try {
      await onDelete(deleteOptions)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStep('options')
    }
  }

  const handleCancel = () => {
    setStep('confirm')
    setDeleteOptions({
      deleteFutureBookings: false,
      transferBookingsTo: null,
      force: false
    })
    setFutureBookings([])
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {step === 'confirm' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Staff Member
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to delete:
              </p>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="font-medium">{staff.first_name} {staff.last_name}</p>
                <p className="text-sm text-gray-600">{staff.email}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ This action will delete all associated data including booking types, schedules, and past bookings.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleInitialDelete}
                disabled={step === 'processing'}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {step === 'processing' ? 'Checking...' : 'Delete Staff Member'}
              </button>
            </div>
          </>
        )}

        {step === 'options' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Staff Has Future Bookings
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                <strong>{staff.first_name} {staff.last_name}</strong> has {futureBookings.length} future booking(s).
                What would you like to do?
              </p>

              {futureBookings.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Upcoming bookings:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {futureBookings.slice(0, 3).map((booking, index) => (
                      <li key={index}>
                        • {booking.title} - {new Date(booking.start_time).toLocaleDateString()}
                      </li>
                    ))}
                    {futureBookings.length > 3 && (
                      <li>• ... and {futureBookings.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <label className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="bookingAction"
                  checked={deleteOptions.deleteFutureBookings}
                  onChange={() => setDeleteOptions({
                    deleteFutureBookings: true,
                    transferBookingsTo: null,
                    force: false
                  })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">Delete all future bookings</div>
                  <div className="text-xs text-gray-600">This will cancel all upcoming appointments</div>
                </div>
              </label>

              {availableStaff.length > 0 && (
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="bookingAction"
                    checked={!!deleteOptions.transferBookingsTo}
                    onChange={() => setDeleteOptions({
                      deleteFutureBookings: false,
                      transferBookingsTo: availableStaff[0]?.id || null,
                      force: false
                    })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Transfer bookings to another staff member</div>
                    <div className="text-xs text-gray-600 mb-2">Bookings will be reassigned</div>
                    {deleteOptions.transferBookingsTo && (
                      <select
                        value={deleteOptions.transferBookingsTo}
                        onChange={(e) => setDeleteOptions({
                          ...deleteOptions,
                          transferBookingsTo: e.target.value
                        })}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        {availableStaff.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.first_name} {member.last_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedDelete}
                disabled={step === 'processing' || (!deleteOptions.deleteFutureBookings && !deleteOptions.transferBookingsTo)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {step === 'processing' ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-4 text-sm text-gray-600">Deleting staff member...</p>
          </div>
        )}
      </div>
    </div>
  )
}