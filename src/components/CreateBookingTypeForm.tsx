'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CreateBookingTypeFormProps {
  userId: string | undefined
}

export default function CreateBookingTypeForm({ userId }: CreateBookingTypeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    duration: 0, // Default to flexible duration options
    description: '',
    price: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    
    try {
      const response = await fetch('/api/booking-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: userId,
          price: formData.price ? parseFloat(formData.price) : null
        })
      })

      if (response.ok) {
        setFormData({ name: '', duration: 0, description: '', price: '' })
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating booking type:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-accent-grey-700">
          Service Name
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
          placeholder="e.g. 30-minute consultation"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-accent-grey-700">
          Duration (minutes)
        </label>
        <select
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
          className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
        >
          <option value={0}>Default (15 mins, 30 mins, 1 hour options)</option>
          <option value={15}>15 minutes only</option>
          <option value={30}>30 minutes only</option>
          <option value={60}>1 hour only</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-accent-grey-700">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
          placeholder="What's this appointment for?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-accent-grey-700">
          Price (optional)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-accent-grey-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="block w-full pl-7 pr-12 border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
            placeholder="0.00"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-blue hover:bg-primary-teal transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Service'}
      </button>
    </form>
  )
}