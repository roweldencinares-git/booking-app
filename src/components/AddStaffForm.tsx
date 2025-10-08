'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddStaffForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    timezone: 'America/Chicago', // Default to Central Time (Wisconsin)
    role: 'admin'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          timezone: 'America/Chicago', // Default to Central Time (Wisconsin)
          role: 'admin'
        })
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating staff member:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-accent-grey-700">
          First Name
        </label>
        <input
          type="text"
          required
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
          placeholder="Darren"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-accent-grey-700">
          Last Name
        </label>
        <input
          type="text"
          required
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
          placeholder="Smith"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-accent-grey-700">
          Email
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
          placeholder="darren@company.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-accent-grey-700">
          Role
        </label>
        <div className="mt-1 p-3 border border-accent-grey-200 rounded-md bg-accent-grey-50">
          <span className="text-sm text-accent-grey-700">👑 Admin - Full access to all features</span>
        </div>
        <p className="mt-1 text-xs text-accent-grey-500">
          All staff members have admin access for now
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-accent-grey-700">
          Timezone
        </label>
        <select
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          className="mt-1 block w-full border border-accent-grey-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Asia/Manila">Philippines</option>
          <option value="Europe/London">London</option>
          <option value="Asia/Tokyo">Tokyo</option>
          <option value="Australia/Sydney">Sydney</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-blue hover:bg-primary-teal transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Team Member'}
      </button>
    </form>
  )
}