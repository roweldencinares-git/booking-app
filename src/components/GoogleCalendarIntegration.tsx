'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Staff {
  id: string
  first_name: string
  last_name: string
  google_calendar_connected?: boolean
  google_access_token?: string
}

interface GoogleCalendarIntegrationProps {
  staff: Staff
}

export default function GoogleCalendarIntegration({ staff }: GoogleCalendarIntegrationProps) {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const [calendars, setCalendars] = useState<any[]>([])
  const [selectedCalendar, setSelectedCalendar] = useState('primary')

  const connectGoogleCalendar = async () => {
    setConnecting(true)
    
    try {
      const response = await fetch(`/api/staff/${staff.id}/google-auth`)
      const data = await response.json()
      
      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error)
      setConnecting(false)
    }
  }

  const disconnectGoogleCalendar = async () => {
    try {
      const response = await fetch(`/api/staff/${staff.id}/google-disconnect`, {
        method: 'POST'
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error)
    }
  }

  const loadCalendars = async () => {
    try {
      const response = await fetch(`/api/staff/${staff.id}/google-calendars`)
      const data = await response.json()
      
      if (data.calendars) {
        setCalendars(data.calendars)
      }
    } catch (error) {
      console.error('Error loading calendars:', error)
    }
  }

  useEffect(() => {
    if (staff.google_calendar_connected) {
      loadCalendars()
    }
  }, [staff.google_calendar_connected])

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Google Calendar</h3>
            <p className="text-sm text-gray-500">
              Sync appointments with {staff.first_name}'s Google Calendar
            </p>
          </div>
        </div>
        
        <div>
          {staff.google_calendar_connected ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✅ Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              ❌ Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {staff.google_calendar_connected ? (
        <div className="space-y-4">
          {/* Calendar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Calendar for Bookings
            </label>
            <select
              value={selectedCalendar}
              onChange={(e) => setSelectedCalendar(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.summary || cal.id} {cal.primary && '(Primary)'}
                </option>
              ))}
            </select>
          </div>

          {/* Features List */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">Active Features:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✅ New bookings automatically added to Google Calendar</li>
              <li>✅ Calendar invites sent to clients</li>
              <li>✅ Booking changes sync to calendar</li>
              <li>✅ Conflict detection with existing events</li>
            </ul>
          </div>

          {/* Disconnect Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={disconnectGoogleCalendar}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Disconnect Google Calendar
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">
            Connect {staff.first_name}'s Google Calendar to:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-6">
            <li>• Automatically create calendar events for new bookings</li>
            <li>• Send calendar invites to clients</li>
            <li>• Prevent double-booking conflicts</li>
            <li>• Keep schedules synchronized</li>
          </ul>
          
          <button
            onClick={connectGoogleCalendar}
            disabled={connecting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {connecting ? (
              <>🔄 Connecting...</>
            ) : (
              <>📅 Connect Google Calendar</>
            )}
          </button>
          
          <p className="text-xs text-gray-500 mt-2">
            You'll be redirected to Google to authorize access
          </p>
        </div>
      )}
    </div>
  )
}