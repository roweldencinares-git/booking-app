'use client'

import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
  currentPath?: string
}

export default function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isActive = (path: string) => currentPath === path

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  if (isLoaded && !user) {
    return null
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-accent-grey-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-accent-grey-50 flex">
      {/* Left Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 relative ${isCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* User Profile Section */}
        <div className={`p-6 border-b border-gray-200 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Administrator
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="py-4 overflow-x-hidden">
          {/* Dashboard Section */}
          <div className="px-3 mb-6">
            {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dashboard</h3>}
            <div className="space-y-1">
              <Link
                href="/admin"
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/admin')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? 'Overview' : ''}
              >
                <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>🏠</span>
                {!isCollapsed && 'Overview'}
              </Link>
            </div>
          </div>

          {/* Sessions Section */}
          <div className="px-3 mb-6">
            {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sessions</h3>}
            <div className="space-y-1">
              <Link
                href="/admin/meetings"
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/admin/meetings')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? 'All Meetings' : ''}
              >
                <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>📅</span>
                {!isCollapsed && 'All Meetings'}
              </Link>
              <Link
                href="/admin/recaps"
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/admin/recaps')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? 'Session Recaps' : ''}
              >
                <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>📊</span>
                {!isCollapsed && 'Session Recaps'}
              </Link>
            </div>
          </div>

          {/* Management Section */}
          <div className="px-3 mb-6">
            {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Management</h3>}
            <div className="space-y-1">
              <Link
                href="/admin/integrations"
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/admin/integrations')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? 'Integrations' : ''}
              >
                <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>🔗</span>
                {!isCollapsed && 'Integrations'}
              </Link>
              <Link
                href="/admin/staff"
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/admin/staff')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? 'Staff' : ''}
              >
                <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>👥</span>
                {!isCollapsed && 'Staff'}
              </Link>
              <Link
                href="/admin/booking-types"
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/admin/booking-types')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? 'Services' : ''}
              >
                <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>📋</span>
                {!isCollapsed && 'Services'}
              </Link>
              <Link
                href="/admin/availability"
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/admin/availability')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? 'Availability' : ''}
              >
                <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>🕒</span>
                {!isCollapsed && 'Availability'}
              </Link>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="px-3 mb-6">
            {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Analytics</h3>}
            <div className="space-y-1">
              <Link
                href="/admin/analytics"
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/admin/analytics')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? 'Reports' : ''}
              >
                <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>📈</span>
                {!isCollapsed && 'Reports'}
              </Link>
            </div>
          </div>

          {/* Settings Section */}
          <div className="px-3 mb-6">
            {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Settings</h3>}
            <div className="space-y-1">
              <Link
                href="/admin/notifications"
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/admin/notifications')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? 'Notifications' : ''}
              >
                <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>🔔</span>
                {!isCollapsed && 'Notifications'}
              </Link>
              <Link
                href="/admin/settings"
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/admin/settings')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? 'System' : ''}
              >
                <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>⚙️</span>
                {!isCollapsed && 'System'}
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
