import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <AdminLayout currentPath="/admin">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your coaching business from this central control panel</p>
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/admin/staff"
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
              href="/admin/booking-types"
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
              href="/admin/meetings"
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-blue-600 text-lg">📅</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upcoming Meetings</h3>
                  <p className="text-sm text-gray-600">View and manage scheduled appointments</p>
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

            <Link
              href="/admin/analytics"
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <span className="text-green-600 text-lg">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
                  <p className="text-sm text-gray-600">View booking statistics and reports</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/availability"
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-blue-600 text-lg">📅</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Availability</h3>
                  <p className="text-sm text-gray-600">Manage coach schedules and availability</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/recaps"
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <span className="text-indigo-600 text-lg">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Session Recaps</h3>
                  <p className="text-sm text-gray-600">Review completed sessions and client progress</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/notifications"
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <span className="text-yellow-600 text-lg">🔔</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Notifications</h3>
                  <p className="text-sm text-gray-600">Configure email and SMS settings</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}