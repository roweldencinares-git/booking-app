import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
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
              href="/dashboard/staff"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <span className="mr-3">👥</span>
              Manage Staff
            </Link>
            <Link
              href="/dashboard/booking-types"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <span className="mr-3">📋</span>
              Manage Services
            </Link>
            <Link
              href="/admin/system/booking-types"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <span className="mr-3">🏷️</span>
              Service Types
            </Link>
            <Link
              href="/admin/settings"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <span className="mr-3">⚙️</span>
              Settings
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

        {/* System Status */}
        <div className="mt-8 px-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">System Status</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Clerk: Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Supabase: Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Zoho: Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back Navigation */}
        <div className="mt-4 px-4">
          <Link
            href="/admin/system"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            ← Back to Appointments
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="p-8">
          <div>

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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Services</h3>
                    <p className="text-sm text-gray-600">Configure booking types and pricing</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/booking-types"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <span className="text-indigo-600 text-lg">🏷️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Service Types</h3>
                    <p className="text-sm text-gray-600">Manage different service categories and types</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/settings"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <span className="text-gray-600 text-lg">⚙️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
                    <p className="text-sm text-gray-600">Configure integrations and preferences</p>
                  </div>
                </div>
              </Link>

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
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <span className="text-blue-600 text-lg">📅</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Availability</h3>
                    <p className="text-sm text-gray-600">Manage coach schedules and availability</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}