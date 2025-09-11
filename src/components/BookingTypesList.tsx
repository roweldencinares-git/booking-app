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

  const deleteBookingType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    setLoading(id)
    
    try {
      const response = await fetch(`/api/booking-types/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting booking type:', error)
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
              
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>{type.duration} minutes</span>
                {type.price && <span>${type.price}</span>}
                <span>Created by {type.users.first_name} {type.users.last_name}</span>
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
                onClick={() => deleteBookingType(type.id)}
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