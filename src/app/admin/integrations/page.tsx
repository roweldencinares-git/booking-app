'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import AdminLayout from '@/components/AdminLayout';

interface IntegrationStatus {
  connected: boolean;
  connectedAt?: string;
  email?: string;
  accountName?: string;
}

interface Integrations {
  google: IntegrationStatus;
  zoom: IntegrationStatus;
}

export default function IntegrationsPage() {
  const { user } = useUser();
  const [integrations, setIntegrations] = useState<Integrations>({
    google: { connected: false },
    zoom: { connected: false }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrationStatus();
  }, [user]);

  async function fetchIntegrationStatus() {
    if (!user) return;

    try {
      const response = await fetch(`/api/integrations/status?userId=${user.id}`);
      const data = await response.json();

      setIntegrations({
        google: data.google || { connected: false },
        zoom: data.zoom || { connected: false }
      });
    } catch (error) {
      console.error('Error fetching integration status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(service: 'google' | 'zoom') {
    if (service === 'google') {
      // Redirect to Google OAuth
      window.location.href = '/api/auth/google';
    } else if (service === 'zoom') {
      // Redirect to Zoom OAuth
      window.location.href = '/api/auth/zoom';
    }
  }

  async function handleDisconnect(service: 'google' | 'zoom') {
    if (!confirm(`Disconnect ${service === 'google' ? 'Google Calendar' : 'Zoom'}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/integrations/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, userId: user?.id })
      });

      if (response.ok) {
        await fetchIntegrationStatus();
        alert(`${service === 'google' ? 'Google Calendar' : 'Zoom'} disconnected successfully`);
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect. Please try again.');
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-gray-600 mb-8">
          Connect your calendar and video conferencing tools to automate scheduling
        </p>

        <div className="space-y-6">
          {/* Google Calendar Integration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Google Calendar</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Sync bookings with your Google Calendar automatically
                  </p>

                  {integrations.google.connected ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Connected
                        </span>
                        {integrations.google.email && (
                          <span className="text-sm text-gray-500">{integrations.google.email}</span>
                        )}
                      </div>
                      {integrations.google.connectedAt && (
                        <p className="text-xs text-gray-500">
                          Connected on {new Date(integrations.google.connectedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Not Connected
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                {integrations.google.connected ? (
                  <button
                    onClick={() => handleDisconnect('google')}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect('google')}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Connect Google
                  </button>
                )}
              </div>
            </div>

            {integrations.google.connected && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Permissions:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Create calendar events</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Update and delete your events</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Read calendar availability</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Zoom Integration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 7h18a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2zm0 2v7h18V9H3zm4 2h2v3H7v-3zm4 0h6v3h-6v-3z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Zoom</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Automatically create Zoom meetings for online sessions
                  </p>

                  {integrations.zoom.connected ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Connected
                        </span>
                        {integrations.zoom.accountName && (
                          <span className="text-sm text-gray-500">{integrations.zoom.accountName}</span>
                        )}
                      </div>
                      {integrations.zoom.connectedAt && (
                        <p className="text-xs text-gray-500">
                          Connected on {new Date(integrations.zoom.connectedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Not Connected
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                {integrations.zoom.connected ? (
                  <button
                    onClick={() => handleDisconnect('zoom')}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect('zoom')}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Connect Zoom
                  </button>
                )}
              </div>
            </div>

            {integrations.zoom.connected && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Permissions:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Create Zoom meetings</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Update and delete meetings</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Read meeting details</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Why connect integrations?</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span><strong>Save time:</strong> Bookings sync automatically to your calendar</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Avoid conflicts:</strong> System checks your calendar before accepting bookings</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span><strong>Seamless meetings:</strong> Zoom links created automatically for online sessions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
