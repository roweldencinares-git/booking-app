'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

interface TimeSlot {
  start: string
  end: string
}

interface DaySchedule {
  day: number
  enabled: boolean
  slots: TimeSlot[]
}

interface Holiday {
  id: string
  name: string
  date: string
  type: 'federal' | 'custom'
  recurring: boolean
}

// US Federal Holidays for 2024-2025
const FEDERAL_HOLIDAYS: Omit<Holiday, 'id'>[] = [
  { name: "New Year's Day", date: "2024-01-01", type: 'federal', recurring: true },
  { name: "Martin Luther King Jr. Day", date: "2024-01-15", type: 'federal', recurring: true },
  { name: "Presidents Day", date: "2024-02-19", type: 'federal', recurring: true },
  { name: "Memorial Day", date: "2024-05-27", type: 'federal', recurring: true },
  { name: "Independence Day", date: "2024-07-04", type: 'federal', recurring: true },
  { name: "Labor Day", date: "2024-09-02", type: 'federal', recurring: true },
  { name: "Columbus Day", date: "2024-10-14", type: 'federal', recurring: true },
  { name: "Veterans Day", date: "2024-11-11", type: 'federal', recurring: true },
  { name: "Thanksgiving", date: "2024-11-28", type: 'federal', recurring: true },
  { name: "Christmas Day", date: "2024-12-25", type: 'federal', recurring: true },
  // 2025
  { name: "New Year's Day", date: "2025-01-01", type: 'federal', recurring: true },
  { name: "Martin Luther King Jr. Day", date: "2025-01-20", type: 'federal', recurring: true },
  { name: "Presidents Day", date: "2025-02-17", type: 'federal', recurring: true },
  { name: "Memorial Day", date: "2025-05-26", type: 'federal', recurring: true },
  { name: "Independence Day", date: "2025-07-04", type: 'federal', recurring: true },
  { name: "Labor Day", date: "2025-09-01", type: 'federal', recurring: true },
  { name: "Columbus Day", date: "2025-10-13", type: 'federal', recurring: true },
  { name: "Veterans Day", date: "2025-11-11", type: 'federal', recurring: true },
  { name: "Thanksgiving", date: "2025-11-27", type: 'federal', recurring: true },
  { name: "Christmas Day", date: "2025-12-25", type: 'federal', recurring: true },
]

export default function CalendlyStyleAvailability() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: 0, enabled: false, slots: [] }, // Sunday
    { day: 1, enabled: true, slots: [{ start: '09:00', end: '17:00' }] }, // Monday
    { day: 2, enabled: true, slots: [{ start: '09:00', end: '17:00' }] }, // Tuesday
    { day: 3, enabled: true, slots: [{ start: '09:00', end: '17:00' }] }, // Wednesday
    { day: 4, enabled: true, slots: [{ start: '09:00', end: '17:00' }] }, // Thursday
    { day: 5, enabled: true, slots: [{ start: '09:00', end: '17:00' }] }, // Friday
    { day: 6, enabled: false, slots: [] }, // Saturday
  ])

  const [settings, setSettings] = useState({
    bufferTime: 15, // minutes
    maxEventsPerDay: 8,
    advanceNotice: 60, // minutes
    dateRange: 30, // days
    meetingDuration: 60, // minutes
    autoCloseHolidays: true,
  })

  const [holidays, setHolidays] = useState<Holiday[]>(
    FEDERAL_HOLIDAYS.map((h, index) => ({ ...h, id: `federal-${index}` }))
  )

  const [customHolidays, setCustomHolidays] = useState<Holiday[]>([])
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', recurring: false })
  const [showHolidayForm, setShowHolidayForm] = useState(false)

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Check if a date is a holiday
  const isHoliday = (dateString: string) => {
    return [...holidays, ...customHolidays].some(holiday => holiday.date === dateString)
  }

  // Get upcoming holidays (next 30 days)
  const getUpcomingHolidays = () => {
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    return [...holidays, ...customHolidays]
      .filter(holiday => {
        const holidayDate = new Date(holiday.date)
        return holidayDate >= today && holidayDate <= thirtyDaysFromNow
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const toggleDay = (dayIndex: number) => {
    setSchedule(prev => prev.map(day =>
      day.day === dayIndex
        ? { ...day, enabled: !day.enabled, slots: !day.enabled ? [{ start: '09:00', end: '17:00' }] : [] }
        : day
    ))
  }

  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => prev.map(day =>
      day.day === dayIndex
        ? {
            ...day,
            slots: day.slots.map((slot, idx) =>
              idx === slotIndex ? { ...slot, [field]: value } : slot
            )
          }
        : day
    ))
  }

  const addTimeSlot = (dayIndex: number) => {
    setSchedule(prev => prev.map(day =>
      day.day === dayIndex
        ? { ...day, slots: [...day.slots, { start: '09:00', end: '17:00' }] }
        : day
    ))
  }

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    setSchedule(prev => prev.map(day =>
      day.day === dayIndex
        ? { ...day, slots: day.slots.filter((_, idx) => idx !== slotIndex) }
        : day
    ))
  }

  const copyToAllDays = (sourceDayIndex: number) => {
    const sourceDay = schedule.find(day => day.day === sourceDayIndex)
    if (!sourceDay) return

    setSchedule(prev => prev.map(day => ({
      ...day,
      enabled: sourceDay.enabled,
      slots: [...sourceDay.slots]
    })))
  }

  const addCustomHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) return

    const holiday: Holiday = {
      id: `custom-${Date.now()}`,
      name: newHoliday.name,
      date: newHoliday.date,
      type: 'custom',
      recurring: newHoliday.recurring
    }

    setCustomHolidays(prev => [...prev, holiday])
    setNewHoliday({ name: '', date: '', recurring: false })
    setShowHolidayForm(false)
  }

  const removeCustomHoliday = (holidayId: string) => {
    setCustomHolidays(prev => prev.filter(h => h.id !== holidayId))
  }

  const toggleFederalHoliday = (holidayId: string) => {
    setHolidays(prev => prev.filter(h => h.id !== holidayId))
  }

  const saveAvailability = async () => {
    // Here you would save to your database
    console.log('Saving availability:', schedule, settings, holidays, customHolidays)
    alert('Availability and holiday settings saved successfully!')
  }

  return (
    <AdminLayout currentPath="/admin/availability">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Your Availability</h1>
          <p className="text-gray-600">Configure when you're available for bookings (Calendly-style)</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Weekly Schedule */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
                <p className="text-sm text-gray-600">Set your available hours for each day</p>
              </div>

              <div className="p-6 space-y-6">
                {schedule.map((day) => (
                  <div key={day.day} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={day.enabled}
                            onChange={() => toggleDay(day.day)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <h3 className={`font-medium ${day.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                          {dayNames[day.day]}
                        </h3>
                      </div>

                      {day.enabled && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => addTimeSlot(day.day)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            + Add hours
                          </button>
                          <button
                            onClick={() => copyToAllDays(day.day)}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Copy to all
                          </button>
                        </div>
                      )}
                    </div>

                    {day.enabled && (
                      <div className="space-y-3">
                        {day.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex items-center gap-4">
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(day.day, slotIndex, 'start', e.target.value)}
                              className="border border-gray-300 rounded-md px-3 py-2"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(day.day, slotIndex, 'end', e.target.value)}
                              className="border border-gray-300 rounded-md px-3 py-2"
                            />
                            {day.slots.length > 1 && (
                              <button
                                onClick={() => removeTimeSlot(day.day, slotIndex)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}

                        {day.slots.length === 0 && (
                          <p className="text-gray-500 text-sm italic">No hours set</p>
                        )}
                      </div>
                    )}

                    {!day.enabled && (
                      <p className="text-gray-400 text-sm">Unavailable</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Booking Settings */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Booking Settings</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Duration
                  </label>
                  <select
                    value={settings.meetingDuration}
                    onChange={(e) => setSettings(prev => ({ ...prev, meetingDuration: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buffer Time
                  </label>
                  <select
                    value={settings.bufferTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, bufferTime: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={0}>No buffer</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Time between meetings</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Notice
                  </label>
                  <select
                    value={settings.advanceNotice}
                    onChange={(e) => setSettings(prev => ({ ...prev, advanceNotice: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={240}>4 hours</option>
                    <option value={1440}>1 day</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Minimum notice needed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Window
                  </label>
                  <select
                    value={settings.dateRange}
                    onChange={(e) => setSettings(prev => ({ ...prev, dateRange: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={7}>1 week</option>
                    <option value={14}>2 weeks</option>
                    <option value={30}>1 month</option>
                    <option value={60}>2 months</option>
                    <option value={90}>3 months</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">How far in advance bookings allowed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Events Per Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.maxEventsPerDay}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxEventsPerDay: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Auto-close on holidays
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoCloseHolidays}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoCloseHolidays: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Automatically block bookings on holidays</p>
                </div>
              </div>
            </div>

            {/* Holiday Management */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Holiday Management</h3>
              </div>
              <div className="p-6 space-y-4">
                {/* Upcoming Holidays */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Upcoming Holidays</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {getUpcomingHolidays().map(holiday => (
                      <div key={holiday.id} className="flex items-center justify-between text-sm p-2 bg-red-50 rounded-lg">
                        <div>
                          <span className="font-medium text-red-900">{holiday.name}</span>
                          <span className="text-red-600 ml-2">
                            {new Date(holiday.date).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-red-600 text-xs">🚫 Closed</span>
                      </div>
                    ))}
                    {getUpcomingHolidays().length === 0 && (
                      <p className="text-gray-500 text-sm italic">No upcoming holidays in next 30 days</p>
                    )}
                  </div>
                </div>

                {/* Add Custom Holiday */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Custom Holidays</h4>
                    <button
                      onClick={() => setShowHolidayForm(!showHolidayForm)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Holiday
                    </button>
                  </div>

                  {showHolidayForm && (
                    <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <input
                        type="text"
                        placeholder="Holiday name"
                        value={newHoliday.name}
                        onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                      <input
                        type="date"
                        value={newHoliday.date}
                        onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="recurring"
                          checked={newHoliday.recurring}
                          onChange={(e) => setNewHoliday(prev => ({ ...prev, recurring: e.target.checked }))}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="recurring" className="text-sm text-gray-700">
                          Recurring annually
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addCustomHoliday}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowHolidayForm(false)}
                          className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Custom Holidays List */}
                  <div className="space-y-2">
                    {customHolidays.map(holiday => (
                      <div key={holiday.id} className="flex items-center justify-between text-sm p-2 border border-gray-200 rounded-lg">
                        <div>
                          <span className="font-medium">{holiday.name}</span>
                          <span className="text-gray-600 ml-2">
                            {new Date(holiday.date).toLocaleDateString()}
                          </span>
                          {holiday.recurring && (
                            <span className="text-blue-600 text-xs ml-2">🔄 Annual</span>
                          )}
                        </div>
                        <button
                          onClick={() => removeCustomHoliday(holiday.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Federal Holidays */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Federal Holidays</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    US federal holidays are automatically included. Click to disable specific holidays.
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {FEDERAL_HOLIDAYS.slice(0, 5).map((holiday, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 border border-gray-100 rounded">
                        <span className="text-gray-700">{holiday.name}</span>
                        <span className="text-green-600 text-xs">✓ Enabled</span>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 italic">+ {FEDERAL_HOLIDAYS.length - 5} more federal holidays</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Presets</h3>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => setSchedule(prev => prev.map(day => ({
                    ...day,
                    enabled: day.day >= 1 && day.day <= 5,
                    slots: day.day >= 1 && day.day <= 5 ? [{ start: '09:00', end: '17:00' }] : []
                  })))}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium text-gray-900">Standard Business Hours</div>
                  <div className="text-sm text-gray-600">Mon-Fri, 9 AM - 5 PM</div>
                </button>

                <button
                  onClick={() => setSchedule(prev => prev.map(day => ({
                    ...day,
                    enabled: day.day >= 1 && day.day <= 5,
                    slots: day.day >= 1 && day.day <= 5 ? [
                      { start: '09:00', end: '12:00' },
                      { start: '13:00', end: '17:00' }
                    ] : []
                  })))}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium text-gray-900">Business Hours with Lunch</div>
                  <div className="text-sm text-gray-600">Mon-Fri, 9-12 & 1-5 PM</div>
                </button>

                <button
                  onClick={() => setSchedule(prev => prev.map(day => ({
                    ...day,
                    enabled: true,
                    slots: [{ start: '10:00', end: '18:00' }]
                  })))}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium text-gray-900">7 Days a Week</div>
                  <div className="text-sm text-gray-600">Every day, 10 AM - 6 PM</div>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveAvailability}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save Availability
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}