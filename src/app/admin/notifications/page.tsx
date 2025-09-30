import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <AdminLayout currentPath="/admin/notifications">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Notification Settings</h1>
          <p className="text-gray-600">Configure email notifications and SMS alerts for bookings</p>
        </div>

        {/* Email Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* Booking Confirmations */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">Booking Confirmations</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Send confirmation emails when new bookings are created
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Booking Reminders */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">Booking Reminders</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Send reminder emails 24 hours before appointments
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Cancellation Notices */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">Cancellation Notices</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Send emails when bookings are cancelled or rescheduled
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Staff Notifications */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">Staff Notifications</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Notify staff members about their upcoming appointments
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Email Address
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="bookings@yourdomain.com"
                  defaultValue="bookings@spearity.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reply-To Email
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="support@yourdomain.com"
                  defaultValue="support@spearity.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject Prefix
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="[BookingApp]"
                  defaultValue="[Spearity Coaching]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Time (hours before)
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="6">6 hours</option>
                  <option value="24" selected>24 hours</option>
                  <option value="48">48 hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">SMS Notifications</h2>
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Coming Soon
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📱</span>
              </div>
              <p className="text-gray-500 mb-4">SMS notifications will be available soon</p>
              <p className="text-sm text-gray-400">
                Get notified about Twilio integration updates for SMS functionality
              </p>
            </div>
          </div>
        </div>

        {/* Email Templates */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Booking Confirmation</h3>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Edit Template
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Sent to clients when they book a new appointment
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Appointment Reminder</h3>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Edit Template
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Sent to clients before their scheduled appointment
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Cancellation Notice</h3>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Edit Template
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Sent when appointments are cancelled or rescheduled
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Save Notification Settings
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}