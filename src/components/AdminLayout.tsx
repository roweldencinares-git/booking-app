import Link from 'next/link'

interface AdminLayoutProps {
  children: React.ReactNode
  currentPath?: string
}

export default function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const isActive = (path: string) => currentPath === path

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
              href="/admin/staff"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/staff')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3">👥</span>
              Manage Staff
            </Link>
            <Link
              href="/admin/booking-types"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/booking-types')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
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
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/settings')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
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
        {children}
      </div>
    </div>
  )
}
