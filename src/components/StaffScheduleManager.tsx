'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string
  timezone: string
}

interface Availability {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

interface StaffScheduleManagerProps {
  staffId: string
  staff: Staff
  availability: Availability[]
}

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
  { id: 0, name: 'Sunday', short: 'Sun' }
]

export default function StaffScheduleManager({ staffId, staff, availability }: StaffScheduleManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState(() => {
    // Convert availability array to schedule object
    const scheduleMap: { [key: number]: { start: string, end: string, available: boolean } } = {}
    
    // Initialize with defaults
    DAYS.forEach(day => {
      scheduleMap[day.id] = {
        start: '09:00',
        end: '17:00',
        available: day.id >= 1 && day.id <= 5 // Monday-Friday default
      }
    })
    
    // Override with existing data
    availability.forEach(avail => {
      scheduleMap[avail.day_of_week] = {
        start: avail.start_time.slice(0, 5), // Convert "09:00:00" to "09:00"
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

  const setDefaultHours = () => {
    const defaultSchedule = { ...schedule }
    DAYS.forEach(day => {
      if (day.id >= 1 && day.id <= 5) { // Monday-Friday
        defaultSchedule[day.id] = {
          start: '09:00',
          end: '17:00',
          available: true
        }
      } else { // Weekend
        defaultSchedule[day.id] = {
          start: '09:00',
          end: '17:00',
          available: false
        }
      }
    })
    setSchedule(defaultSchedule)
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-accent-grey-900">Set Weekly Hours</h3>
          <p className="text-sm text-accent-grey-500">Configure when {staff.first_name} is available for bookings</p>
        </div>
        <div className="space-x-2">
          <button
            onClick={setDefaultHours}
            className="inline-flex items-center px-3 py-2 border border-accent-grey-300 shadow-sm text-sm leading-4 font-medium rounded-md text-accent-grey-700 bg-white hover:bg-accent-grey-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue"
          >
            📅 Set 9-5 M-F
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="space-y-4">
        {DAYS.map((day) => (
          <div key={day.id} className="flex items-center space-x-4 p-4 border border-accent-grey-200 rounded-lg">
            {/* Day Name */}
            <div className="w-24 flex-shrink-0">
              <span className="text-sm font-medium text-accent-grey-900">{day.name}</span>
            </div>

            {/* Available Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={schedule[day.id]?.available || false}
                onChange={(e) => updateSchedule(day.id, 'available', e.target.checked)}
                className="h-4 w-4 text-primary-blue focus:ring-primary-blue border-accent-grey-300 rounded"
              />
              <label className="ml-2 text-sm text-accent-grey-600">
                Available
              </label>
            </div>

            {/* Time Inputs */}
            {schedule[day.id]?.available && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-accent-grey-500">from</span>
                  <input
                    type="time"
                    value={schedule[day.id]?.start || '09:00'}
                    onChange={(e) => updateSchedule(day.id, 'start', e.target.value)}
                    className="block w-24 border border-accent-grey-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
                  />
                  <span className="text-sm text-accent-grey-500">to</span>
                  <input
                    type="time"
                    value={schedule[day.id]?.end || '17:00'}
                    onChange={(e) => updateSchedule(day.id, 'end', e.target.value)}
                    className="block w-24 border border-accent-grey-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
                  />
                  <span className="text-sm text-accent-grey-500">
                    ({staff.timezone})
                  </span>
                </div>
              </>
            )}

            {/* Unavailable Message */}
            {!schedule[day.id]?.available && (
              <span className="text-sm text-accent-grey-400 italic">Not available</span>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={saveSchedule}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-blue hover:bg-primary-teal transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue disabled:opacity-50"
        >
          {loading ? 'Saving...' : '💾 Save Schedule'}
        </button>
      </div>
    </div>
  )
}