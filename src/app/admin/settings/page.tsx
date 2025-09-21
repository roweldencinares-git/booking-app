import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <AdminLayout currentPath="/admin/settings">
      <div className="flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Back to Appointments
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 bg-white p-6">
          <div className="max-w-4xl">
            {/* Authorized redirect URLs */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-medium text-gray-900">Authorized redirect URLs</h2>
                <button className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center">
                  ?
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">For use with requests from a web server</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    URIs 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    defaultValue="https://meetings.spearity.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    URIs 2 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    defaultValue="https://meetings.spearity.com/api/auth/google/callback"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    URIs 3 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    defaultValue="http://localhost:3004/api/auth/google/callback"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    URIs 4 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    defaultValue="https://clerk.spearity.com/v1/oauth_callback"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  <span>+</span>
                  Add URI
                </button>
              </div>
            </div>

            {/* API Configuration */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-6">API Configuration</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Zoho CRM API Key
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Google Calendar Client ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter client ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Zoom API Key
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Supabase URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Email Configuration */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Email Configuration</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    placeholder="587"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Email Username
                  </label>
                  <input
                    type="email"
                    placeholder="admin@spearity.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Email Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}