'use client'

import { useState } from 'react'

interface BookingType {
  id: string
  name: string
  duration: number
  active: boolean
}

interface AvailabilitySettings {
  id?: string
  user_id: string
  timezone: string
  weekly_hours: {
    [key: string]: {
      enabled: boolean
      start: string
      end: string
    }
  }
  date_overrides: {
    [key: string]: {
      available: boolean
      start?: string
      end?: string
      reason?: string
    }
  }
}

interface AvailabilityContentProps {
  availability: AvailabilitySettings
  bookingTypes: BookingType[]
  userId: string
}

export default function AvailabilityContent({
  availability,
  bookingTypes,
  userId
}: AvailabilityContentProps) {
  const [activeTab, setActiveTab] = useState<'schedules' | 'calendar-settings' | 'advanced'>('schedules')
  const [selectedSchedule, setSelectedSchedule] = useState('default')
  const [weeklyHours, setWeeklyHours] = useState(availability.weekly_hours)
  const [timezone, setTimezone] = useState(availability.timezone)
  const [dateOverrides, setDateOverrides] = useState(availability.date_overrides)
  const [showAddOverride, setShowAddOverride] = useState(false)
  const [newOverride, setNewOverride] = useState({ date: '', available: false, reason: '' })

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ]

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const minute = i % 2 === 0 ? '00' : '30'
    const time = `${hour.toString().padStart(2, '0')}:${minute}`
    const display = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    return { value: time, display }
  })

  const weekDays = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ]

  const updateWeeklyHours = (day: string, field: string, value: any) => {
    setWeeklyHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const addDateOverride = () => {
    if (!newOverride.date) return

    setDateOverrides(prev => ({
      ...prev,
      [newOverride.date]: {
        available: newOverride.available,
        reason: newOverride.reason
      }
    }))

    setNewOverride({ date: '', available: false, reason: '' })
    setShowAddOverride(false)
  }

  const removeDateOverride = (date: string) => {
    setDateOverrides(prev => {
      const newOverrides = { ...prev }
      delete newOverrides[date]
      return newOverrides
    })
  }

  const saveAvailability = async () => {
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          timezone,
          weekly_hours: weeklyHours,
          date_overrides: dateOverrides
        })
      })

      if (response.ok) {
        // Show success message
        console.log('Availability saved successfully')
      } else {
        console.error('Failed to save availability')
      }
    } catch (error) {
      console.error('Error saving availability:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
        <p className="text-gray-600 mt-2">Set when you are typically available for meetings</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Schedules
            </button>
            <button
              onClick={() => setActiveTab('calendar-settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calendar-settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Calendar settings
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Advanced settings
            </button>
          </nav>
        </div>
      </div>

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Schedule Selection */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>

              <div className="space-y-3">
                <div
                  className={`p-4 rounded-lg border cursor-pointer ${
                    selectedSchedule === 'default'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSchedule('default')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Default Schedule</h4>
                      <p className="text-sm text-gray-600">Standard availability</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                + Add new schedule
              </button>
            </div>

            {/* Event Types */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active on:</h3>
              <div className="space-y-2">
                {bookingTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{type.name}</h4>
                      <p className="text-sm text-gray-600">{type.duration} minutes</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                ))}
                {bookingTypes.length === 0 && (
                  <p className="text-gray-500 text-sm">No active booking types</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">{bookingTypes.length} event types</p>
            </div>
          </div>

          {/* Right Column - Weekly Hours */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Weekly hours</h3>
                <div className="flex items-center gap-4">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={saveAvailability}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {weekDays.map((day) => (
                  <div key={day.key} className="flex items-center gap-4">
                    <div className="w-24">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={weeklyHours[day.key]?.enabled || false}
                          onChange={(e) => updateWeeklyHours(day.key, 'enabled', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">{day.label}</span>
                      </label>
                    </div>

                    {weeklyHours[day.key]?.enabled ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={weeklyHours[day.key].start}
                          onChange={(e) => updateWeeklyHours(day.key, 'start', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {timeOptions.map((time) => (
                            <option key={time.value} value={time.value}>
                              {time.display}
                            </option>
                          ))}
                        </select>
                        <span className="text-gray-500">to</span>
                        <select
                          value={weeklyHours[day.key].end}
                          onChange={(e) => updateWeeklyHours(day.key, 'end', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {timeOptions.map((time) => (
                            <option key={time.value} value={time.value}>
                              {time.display}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Unavailable</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Date-specific hours */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Date-specific hours</h4>
                  <button
                    onClick={() => setShowAddOverride(true)}
                    className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                  >
                    + Add override
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">Adjust hours for specific days</p>

                {showAddOverride && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="date"
                        value={newOverride.date}
                        onChange={(e) => setNewOverride(prev => ({ ...prev, date: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <select
                        value={newOverride.available ? 'available' : 'unavailable'}
                        onChange={(e) => setNewOverride(prev => ({ ...prev, available: e.target.value === 'available' }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="unavailable">Unavailable</option>
                        <option value="available">Custom hours</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={newOverride.reason}
                        onChange={(e) => setNewOverride(prev => ({ ...prev, reason: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={addDateOverride}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddOverride(false)}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {Object.entries(dateOverrides)
                    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                    .map(([date, override]) => (
                      <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{formatDate(date)}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            override.available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {override.available ? 'Custom hours' : 'Unavailable'}
                          </span>
                          {override.reason && (
                            <span className="text-sm text-gray-600">• {override.reason}</span>
                          )}
                        </div>
                        <button
                          onClick={() => removeDateOverride(date)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  }

                  {Object.keys(dateOverrides).length === 0 && (
                    <p className="text-gray-500 text-sm py-4">No date overrides set</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Settings Tab */}
      {activeTab === 'calendar-settings' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar Settings</h3>
          <p className="text-gray-600">Configure how your calendar integrates with your availability.</p>
          {/* Add calendar integration settings here */}
        </div>
      )}

      {/* Advanced Settings Tab */}
      {activeTab === 'advanced' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h3>
          <p className="text-gray-600">Configure advanced availability options.</p>
          {/* Add advanced settings here */}
        </div>
      )}
    </div>
  )
}