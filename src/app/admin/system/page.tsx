import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SystemAdminPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">System Administration</h1>
        </div>
        <nav className="mt-6">
          <div className="px-4 space-y-1">
            <Link
              href="/admin/system"
              className="bg-blue-100 text-blue-700 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <span className="mr-3">🔧</span>
              Connection Status
            </Link>
            <Link
              href="/admin/system/staff"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <span className="mr-3">👥</span>
              Manage Staff
            </Link>
            <Link
              href="/admin/system/booking-types"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <span className="mr-3">📋</span>
              Booking Types
            </Link>
            <Link
              href="/admin/system/analytics"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <span className="mr-3">📊</span>
              Analytics
            </Link>
            <Link
              href="/admin/system/notifications"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <span className="mr-3">🔔</span>
              Notifications
            </Link>
            <Link
              href="/admin/system/maintenance"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <span className="mr-3">🔧</span>
              Maintenance
            </Link>
          </div>
        </nav>

        {/* Back Navigation */}
        <div className="mt-8 px-4">
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            ← Back to Admin
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">System Administration</h1>

          {/* Connection Status Section */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Connection Status</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Clerk Authentication</h3>
                    <p className="text-sm text-gray-600">Connected</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Supabase Database</h3>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Zoho CRM</h3>
                    <p className="text-sm text-gray-600">Connected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Administrative Actions Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Administrative Actions</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                href="/dashboard/staff"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <span className="text-purple-600 text-lg">👥</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Staff</h3>
                    <p className="text-sm text-gray-600">Add, edit, and configure staff members</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/booking-types"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <span className="text-orange-600 text-lg">📋</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Types</h3>
                    <p className="text-sm text-gray-600">Configure services and pricing</p>
                  </div>
                </div>
              </Link>

              <button className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group text-left">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <span className="text-gray-600 text-lg">⚙️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
                    <p className="text-sm text-gray-600">Configure integrations and preferences</p>
                  </div>
                </div>
              </button>

              <button className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group text-left">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <span className="text-green-600 text-lg">📊</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
                    <p className="text-sm text-gray-600">View booking statistics and reports</p>
                  </div>
                </div>
              </button>

              <button className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group text-left">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                    <span className="text-yellow-600 text-lg">🔔</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Notifications</h3>
                    <p className="text-sm text-gray-600">Configure email and SMS settings</p>
                  </div>
                </div>
              </button>

              <button className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group text-left">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <span className="text-blue-600 text-lg">🔧</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Maintenance</h3>
                    <p className="text-sm text-gray-600">Database cleanup and system tools</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}