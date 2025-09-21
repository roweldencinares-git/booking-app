import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'

export const dynamic = 'force-dynamic'

export default async function SystemAdminPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <AdminLayout currentPath="/admin/system">
      <div className="flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
                  <span>+</span>
                  New Appointment
                </button>
                <Link
                  href="/"
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b">
          <div className="px-6">
            <nav className="flex space-x-8">
              <button className="border-b-2 border-purple-500 py-4 px-1 text-sm font-medium text-purple-600">
                Upcoming
              </button>
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                Past
              </button>
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                Custom Date
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white">
          <div className="px-6 py-4">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
              <div>TIME</div>
              <div>BOOKING ID</div>
              <div>CONSULTATION</div>
              <div>CONSULTANTS/RESOURCES</div>
              <div>CUSTOMER</div>
              <div></div>
            </div>

            {/* Sample Appointments */}
            <div className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center gap-2 py-2">
                <span className="text-sm text-gray-500">📅</span>
                <span className="text-sm font-medium text-gray-900">22 Sep 2025</span>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">2 Appointments</span>
              </div>

              {/* Appointment Rows */}
              <div className="grid grid-cols-6 gap-4 items-center py-3 border-b border-gray-100">
                <div className="text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    03:45 pm - 04:15 pm
                  </div>
                </div>
                <div className="text-sm text-gray-900">SP-00008</div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded text-xs flex items-center justify-center font-medium">A</span>
                  <span className="text-sm text-gray-900">ADVISE - Post-Reset Goals Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <span className="text-sm text-gray-900">Michael Rampolla</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">👤</span>
                  <span className="text-sm text-gray-900">Andrea Kiemen-Rognsvoog</span>
                </div>
                <div className="text-sm text-gray-500">Free</div>
              </div>

              <div className="grid grid-cols-6 gap-4 items-center py-3 border-b border-gray-100">
                <div className="text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    04:30 pm - 05:00 pm
                  </div>
                </div>
                <div className="text-sm text-gray-900">SP-00009</div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded text-xs flex items-center justify-center font-medium">A</span>
                  <span className="text-sm text-gray-900">ADVISE - Post-Reset Goals Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <span className="text-sm text-gray-900">Michael Rampolla</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">👤</span>
                  <span className="text-sm text-gray-900">Chris Luecke</span>
                </div>
                <div className="text-sm text-gray-500">Free</div>
              </div>

              {/* Date Header */}
              <div className="flex items-center gap-2 py-2 mt-6">
                <span className="text-sm text-gray-500">📅</span>
                <span className="text-sm font-medium text-gray-900">23 Sep 2025</span>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">2 Appointments</span>
              </div>

              <div className="grid grid-cols-6 gap-4 items-center py-3 border-b border-gray-100">
                <div className="text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    08:30 am - 09:00 am
                  </div>
                </div>
                <div className="text-sm text-gray-900">SP-00010</div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded text-xs flex items-center justify-center font-medium">A</span>
                  <span className="text-sm text-gray-900">ADVISE - Post-Reset Goals Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <span className="text-sm text-gray-900">Michael Rampolla</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">👤</span>
                  <span className="text-sm text-gray-900">Angila Allen</span>
                </div>
                <div className="text-sm text-gray-500">Free</div>
              </div>

              <div className="grid grid-cols-6 gap-4 items-center py-3 border-b border-gray-100">
                <div className="text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    01:00 pm - 01:30 pm
                  </div>
                </div>
                <div className="text-sm text-gray-900">SP-00012</div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded text-xs flex items-center justify-center font-medium">S3</span>
                  <span className="text-sm text-gray-900">Schedule 30-min Zoom with Michael</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <span className="text-sm text-gray-900">Michael Rampolla</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">👤</span>
                  <span className="text-sm text-gray-900">Russell Rapant</span>
                </div>
                <div className="text-sm text-gray-500">Free</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}