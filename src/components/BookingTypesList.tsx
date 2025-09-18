'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BookingType {
  id: string
  name: string
  duration: number
  description: string | null
  price: number | null
  is_active: boolean
  created_at: string
  users: {
    first_name: string
    last_name: string
    email: string
  }
}

interface BookingTypesListProps {
  bookingTypes: BookingType[]
}

export default function BookingTypesList({ bookingTypes }: BookingTypesListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const toggleActive = async (id: string, isActive: boolean) => {
    setLoading(id)
    
    try {
      const response = await fetch(`/api/booking-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating booking type:', error)
    } finally {
      setLoading(null)
    }
  }

  const deleteBookingType = async (id: string, serviceName: string) => {
    const baseMessage = `Are you sure you want to delete the service "${serviceName}"?\n\nThis action cannot be undone.`

    if (!confirm(baseMessage)) {
      return
    }

    setLoading(id)

    try {
      const response = await fetch(`/api/booking-types/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        // Show success message with details
        if (data.message) {
          alert(data.message)
        } else {
          alert(`Service "${serviceName}" deleted successfully.`)
        }
        router.refresh()
      } else {
        alert(`Error: ${data.error || 'Failed to delete service'}`)
      }
    } catch (error) {
      console.error('Error deleting booking type:', error)
      alert('Network error: Failed to delete service')
    } finally {
      setLoading(null)
    }
  }

  if (bookingTypes.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
        <p className="text-gray-500">Create your first service to get started with bookings.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {bookingTypes.map((type) => (
        <div key={type.id} className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {type.name}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  type.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {type.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{type.duration} minutes</span>
                  {type.price && <span>${type.price}</span>}
                  <span>Created by {type.users.first_name} {type.users.last_name}</span>
                </div>

                {/* Personalized URL */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">URL:</span>
                  <a
                    href={`https://meetings.spearity.com/${type.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline font-mono"
                  >
                    meetings.spearity.com/{type.name}
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(`https://meetings.spearity.com/${type.name}`)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy URL"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {type.description && (
                <p className="mt-2 text-sm text-gray-600">{type.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleActive(type.id, type.is_active)}
                disabled={loading === type.id}
                className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${
                  type.is_active
                    ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
              >
                {loading === type.id ? '...' : type.is_active ? 'Disable' : 'Enable'}
              </button>

              <button
                onClick={() => deleteBookingType(type.id, type.name)}
                disabled={loading === type.id}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading === type.id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}