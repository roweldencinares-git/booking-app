'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StaffConfigurationProps {
  staffId: string
  staff: {
    id: string
    first_name: string
    last_name: string
    email: string
    role?: string
    status?: string
    timezone: string
  }
}

export default function StaffConfiguration({ staffId, staff }: StaffConfigurationProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [config, setConfig] = useState({
    // Availability Settings
    working_hours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' }
    },
    // Booking Settings
    booking_buffer: 15, // minutes between bookings
    advance_booking_days: 30, // how far ahead bookings can be made
    min_booking_notice: 60, // minimum minutes notice required
    // Notification Settings
    notifications: {
      email_reminders: true,
      sms_reminders: false,
      booking_confirmations: true,
      schedule_changes: true
    },
    // Permission Settings
    permissions: {
      can_view_all_bookings: staff.role === 'admin' || staff.role === 'manager',
      can_edit_own_schedule: true,
      can_cancel_bookings: staff.role !== 'viewer',
      can_reschedule_bookings: staff.role !== 'viewer'
    }
  })

  const updateConfiguration = async (section: string, updates: any) => {
    setLoading(section)

    try {
      const response = await fetch(`/api/staff/${staffId}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, updates })
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to update configuration')
      }
    } catch (error) {
      console.error('Error updating configuration:', error)
      alert('Error updating configuration')
    } finally {
      setLoading(null)
    }
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Configuration for {staff.first_name} {staff.last_name}
        </h2>
        <p className="text-gray-600">
          Manage availability, permissions, and notification settings
        </p>
      </div>

      {/* Working Hours */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          🕒 Working Hours
        </h3>
        <div className="space-y-4">
          {days.map((day, index) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-24">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.working_hours[day].enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      working_hours: {
                        ...config.working_hours,
                        [day]: { ...config.working_hours[day], enabled: e.target.checked }
                      }
                    })}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{dayLabels[index]}</span>
                </label>
              </div>

              {config.working_hours[day].enabled && (
                <>
                  <input
                    type="time"
                    value={config.working_hours[day].start}
                    onChange={(e) => setConfig({
                      ...config,
                      working_hours: {
                        ...config.working_hours,
                        [day]: { ...config.working_hours[day], start: e.target.value }
                      }
                    })}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={config.working_hours[day].end}
                    onChange={(e) => setConfig({
                      ...config,
                      working_hours: {
                        ...config.working_hours,
                        [day]: { ...config.working_hours[day], end: e.target.value }
                      }
                    })}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  />
                </>
              )}
            </div>
          ))}

          <button
            onClick={() => updateConfiguration('working_hours', config.working_hours)}
            disabled={loading === 'working_hours'}
            className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading === 'working_hours' ? 'Saving...' : 'Save Working Hours'}
          </button>
        </div>
      </div>

      {/* Booking Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          📅 Booking Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Buffer Time (minutes)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={config.booking_buffer}
              onChange={(e) => setConfig({ ...config, booking_buffer: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">Time between bookings</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Advance Booking (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={config.advance_booking_days}
              onChange={(e) => setConfig({ ...config, advance_booking_days: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">How far ahead bookings allowed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Notice (minutes)
            </label>
            <input
              type="number"
              min="0"
              max="1440"
              value={config.min_booking_notice}
              onChange={(e) => setConfig({ ...config, min_booking_notice: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">Required notice for bookings</p>
          </div>
        </div>

        <button
          onClick={() => updateConfiguration('booking_settings', {
            booking_buffer: config.booking_buffer,
            advance_booking_days: config.advance_booking_days,
            min_booking_notice: config.min_booking_notice
          })}
          disabled={loading === 'booking_settings'}
          className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading === 'booking_settings' ? 'Saving...' : 'Save Booking Settings'}
        </button>
      </div>

      {/* Notifications */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          🔔 Notification Preferences
        </h3>
        <div className="space-y-4">
          {Object.entries(config.notifications).map(([key, value]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setConfig({
                  ...config,
                  notifications: { ...config.notifications, [key]: e.target.checked }
                })}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {key.replace(/_/g, ' ')}
              </span>
            </label>
          ))}

          <button
            onClick={() => updateConfiguration('notifications', config.notifications)}
            disabled={loading === 'notifications'}
            className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading === 'notifications' ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          🔐 Permissions
        </h3>
        <div className="space-y-4">
          {Object.entries(config.permissions).map(([key, value]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setConfig({
                  ...config,
                  permissions: { ...config.permissions, [key]: e.target.checked }
                })}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                disabled={staff.role === 'admin'} // Admins always have all permissions
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {key.replace(/_/g, ' ')}
              </span>
              {staff.role === 'admin' && key === 'can_view_all_bookings' && (
                <span className="ml-2 text-xs text-gray-500">(Admin always enabled)</span>
              )}
            </label>
          ))}

          <button
            onClick={() => updateConfiguration('permissions', config.permissions)}
            disabled={loading === 'permissions'}
            className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading === 'permissions' ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  )
}