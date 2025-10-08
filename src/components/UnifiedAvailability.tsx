'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UnifiedAvailabilityProps {
  staffId: string
  staff: {
    id: string
    first_name: string
    last_name: string
    email: string
    timezone: string
    google_calendar_connected?: boolean
    zoom_connected?: boolean
  }
  initialAvailability: any[]
}

type TabType = 'schedule' | 'integrations' | 'timeoff' | 'settings'

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
  { id: 0, name: 'Sunday', short: 'Sun' }
]

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT) - Wisconsin' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Asia/Manila', label: 'Philippines Time (PHT)' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
  { value: 'Europe/London', label: 'London Time (GMT/BST)' },
]

export default function UnifiedAvailability({ staffId, staff, initialAvailability }: UnifiedAvailabilityProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('schedule')
  const [loading, setLoading] = useState(false)
  const [timezone, setTimezone] = useState(staff.timezone || 'America/Chicago')

  // Schedule state
  const [schedule, setSchedule] = useState(() => {
    const scheduleMap: { [key: number]: { start: string, end: string, available: boolean } } = {}

    DAYS.forEach(day => {
      scheduleMap[day.id] = {
        start: '09:00',
        end: '17:00',
        available: day.id >= 1 && day.id <= 5
      }
    })

    initialAvailability?.forEach((avail: any) => {
      scheduleMap[avail.day_of_week] = {
        start: avail.start_time.slice(0, 5),
        end: avail.end_time.slice(0, 5),
        available: avail.is_available
      }
    })

    return scheduleMap
  })

  const updateSchedule = (dayId: number, field: 'start' | 'end' | 'available', value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }))
  }

  const saveSchedule = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/staff/${staffId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule })
      })

      if (response.ok) {
        router.refresh()
        alert('Schedule saved successfully!')
      } else {
        alert('Failed to save schedule')
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Error saving schedule')
    } finally {
      setLoading(false)
    }
  }

  const saveTimezone = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone })
      })

      if (response.ok) {
        router.refresh()
        alert('Timezone saved successfully!')
      } else {
        alert('Failed to save timezone')
      }
    } catch (error) {
      console.error('Error saving timezone:', error)
      alert('Error saving timezone')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleConnect = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/staff/${staffId}/google-auth`)
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error connecting Google:', error)
      alert('Error connecting Google Calendar')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/staff/${staffId}/google-disconnect`, {
        method: 'POST'
      })

      if (response.ok) {
        router.refresh()
        alert('Google Calendar disconnected')
      }
    } catch (error) {
      console.error('Error disconnecting Google:', error)
      alert('Error disconnecting Google Calendar')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'schedule' as TabType, name: 'Schedule', icon: '📅' },
    { id: 'integrations' as TabType, name: 'Integrations', icon: '🔗' },
    { id: 'timeoff' as TabType, name: 'Time Off', icon: '🏖️' },
    { id: 'settings' as TabType, name: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Availability Management
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your schedule, integrations, time off, and settings in one place
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Weekly Schedule
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Set your working hours for each day of the week
                </p>
              </div>

              <div className="space-y-4">
                {DAYS.map((day) => (
                  <div key={day.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-32">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={schedule[day.id]?.available || false}
                          onChange={(e) => updateSchedule(day.id, 'available', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                        />
                        <span className="font-medium text-gray-900">{day.name}</span>
                      </label>
                    </div>

                    {schedule[day.id]?.available && (
                      <>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={schedule[day.id]?.start || '09:00'}
                            onChange={(e) => updateSchedule(day.id, 'start', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">End Time</label>
                          <input
                            type="time"
                            value={schedule[day.id]?.end || '17:00'}
                            onChange={(e) => updateSchedule(day.id, 'end', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {!schedule[day.id]?.available && (
                      <div className="flex-1 text-gray-400 italic">
                        Unavailable
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveSchedule}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Calendar & Meeting Integrations
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Connect your calendar and video conferencing tools
                </p>
              </div>

              {/* Google Calendar */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">📅</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Google Calendar</h3>
                      <p className="text-sm text-gray-600">
                        {staff.google_calendar_connected
                          ? 'Sync bookings with your Google Calendar'
                          : 'Connect to automatically create calendar events'}
                      </p>
                    </div>
                  </div>
                  <div>
                    {staff.google_calendar_connected ? (
                      <div className="space-y-2">
                        <div className="flex items-center text-green-600">
                          <span className="mr-2">✓</span>
                          <span className="font-medium">Connected</span>
                        </div>
                        <button
                          onClick={handleGoogleDisconnect}
                          disabled={loading}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleGoogleConnect}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Zoom */}
              <div className="border border-gray-200 rounded-lg p-6 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">🎥</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Zoom</h3>
                      <p className="text-sm text-gray-600">
                        Automatically create Zoom meetings for bookings
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Off Tab */}
          {activeTab === 'timeoff' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Time Off & Blocked Dates
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Block specific dates when you're unavailable
                </p>
              </div>

              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🏖️</div>
                <p className="text-lg font-medium">Time Off Management</p>
                <p className="text-sm mt-2">Coming soon - block specific dates and holidays</p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  General Settings
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Configure your timezone and preferences
                </p>
              </div>

              {/* Timezone */}
              <div className="border border-gray-200 rounded-lg p-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Timezone
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  All bookings will be created in this timezone
                </p>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={saveTimezone}
                    disabled={loading || timezone === staff.timezone}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Timezone'}
                  </button>
                </div>
              </div>

              {/* Profile Info */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4">Profile Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-600">Name</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {staff.first_name} {staff.last_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Email</dt>
                    <dd className="text-sm font-medium text-gray-900">{staff.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Current Timezone</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {TIMEZONES.find(tz => tz.value === staff.timezone)?.label || staff.timezone}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
