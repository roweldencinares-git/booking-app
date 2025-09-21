'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ZoomIntegrationProps {
  staff: {
    id: string
    first_name: string
    last_name: string
    email: string
    zoom_connected?: boolean
  }
}

interface ZoomIntegration {
  id: string
  provider: string
  access_token: string
  refresh_token?: string
  is_active: boolean
  created_at: string
  expires_at?: string
}

export default function ZoomIntegration({ staff }: ZoomIntegrationProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [zoomIntegration, setZoomIntegration] = useState<ZoomIntegration | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadZoomIntegration()
  }, [staff.id])

  const loadZoomIntegration = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/staff/${staff.id}/zoom-integration`)
      if (response.ok) {
        const data = await response.json()
        setZoomIntegration(data.integration)
      } else if (response.status === 404) {
        setZoomIntegration(null)
      } else {
        throw new Error('Failed to load Zoom integration')
      }
    } catch (error) {
      console.error('Error loading Zoom integration:', error)
      setError('Failed to load Zoom integration status')
    } finally {
      setLoading(false)
    }
  }

  const connectZoom = async () => {
    setConnecting(true)
    setError(null)

    try {
      // Redirect to Zoom OAuth
      const authUrl = `/api/auth/zoom?user_id=${staff.id}`
      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting to Zoom:', error)
      setError('Failed to initiate Zoom connection')
      setConnecting(false)
    }
  }

  const disconnectZoom = async () => {
    if (!confirm('Are you sure you want to disconnect Zoom? This will remove access to create Zoom meetings for bookings.')) {
      return
    }

    setDisconnecting(true)
    setError(null)

    try {
      const response = await fetch(`/api/staff/${staff.id}/zoom-integration`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect Zoom')
      }

      setZoomIntegration(null)
      router.refresh()
    } catch (error) {
      console.error('Error disconnecting Zoom:', error)
      setError('Failed to disconnect Zoom')
    } finally {
      setDisconnecting(false)
    }
  }

  const isConnected = zoomIntegration?.is_active
  const isExpired = zoomIntegration?.expires_at && new Date(zoomIntegration.expires_at) < new Date()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading Zoom integration...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.5 6.75L12 10.5L19.5 6.75V4.5C19.5 3.675 18.825 3 18 3H6C5.175 3 4.5 3.675 4.5 4.5V6.75ZM4.5 8.25V19.5C4.5 20.325 5.175 21 6 21H18C18.825 21 19.5 20.325 19.5 19.5V8.25L12 12L4.5 8.25Z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Zoom Integration</h3>
            <p className="text-sm text-gray-500">
              {isConnected && !isExpired ? (
                <>Connected • Meetings will be created automatically</>
              ) : isExpired ? (
                <>Connection expired • Please reconnect</>
              ) : (
                <>Not connected • Connect to create Zoom meetings for bookings</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isConnected && !isExpired ? (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
              <button
                onClick={disconnectZoom}
                disabled={disconnecting}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <button
              onClick={connectZoom}
              disabled={connecting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                'Connect Zoom'
              )}
            </button>
          )}
        </div>
      </div>

      {isConnected && zoomIntegration && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Integration Details</h4>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Connected</dt>
              <dd className="text-sm text-gray-900">
                {new Date(zoomIntegration.created_at).toLocaleDateString()}
              </dd>
            </div>
            {zoomIntegration.expires_at && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Expires</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(zoomIntegration.expires_at).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Zoom Integration</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Automatically creates Zoom meetings for all new bookings</li>
                <li>Meeting links are included in confirmation emails</li>
                <li>Meetings are updated when bookings are rescheduled</li>
                <li>Meetings are deleted when bookings are cancelled</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}