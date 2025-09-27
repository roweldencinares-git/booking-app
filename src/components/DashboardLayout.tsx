import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <Link href="/" className="text-xl font-bold text-gray-900">
            BookingApp
          </Link>
        </div>
        <nav className="mt-6">
          <div className="px-4 space-y-1">
            <Link
              href="/dashboard"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3">🏠</span>
              Dashboard
            </Link>
            <Link
              href="/book"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/book')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3">📅</span>
              Book Session
            </Link>
            <Link
              href="/dashboard/meetings"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/meetings')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3">📋</span>
              My Meetings
            </Link>
            <Link
              href="/dashboard/recaps"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/recaps')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3">📊</span>
              Recaps
            </Link>
            <Link
              href="/dashboard/availability"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/availability')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3">🕒</span>
              Availability
            </Link>
            <Link
              href="/dashboard/profile"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/profile')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3">⚙️</span>
              Profile
            </Link>
          </div>
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 px-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-medium">5 sessions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Upcoming</span>
                <span className="font-medium">2 sessions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Hours</span>
                <span className="font-medium">12.5 hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Link (if applicable) */}
        <div className="mt-4 px-4">
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            🔧 Admin Panel
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