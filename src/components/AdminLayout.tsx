'use client'

import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
  currentPath?: string
}

export default function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Admin Dashboard
          </Link>
          <p className="text-sm text-gray-600 mt-1">Management Console</p>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-gray-500 truncate">
                Administrator
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-6">
          {/* Dashboard Section */}
          <div className="px-4 mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dashboard</h3>
            <div className="space-y-1">
              <Link
                href="/admin"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">🏠</span>
                Overview
              </Link>
            </div>
          </div>

          {/* Sessions Section */}
          <div className="px-4 mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sessions</h3>
            <div className="space-y-1">
              <Link
                href="/admin/meetings"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin/meetings')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">📅</span>
                All Meetings
              </Link>
              <Link
                href="/admin/recaps"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin/recaps')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">📊</span>
                Session Recaps
              </Link>
            </div>
          </div>

          {/* Management Section */}
          <div className="px-4 mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Management</h3>
            <div className="space-y-1">
              <Link
                href="/admin/staff"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin/staff')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">👥</span>
                Staff
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
                Services
              </Link>
              <Link
                href="/admin/availability"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin/availability')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">🕒</span>
                Availability
              </Link>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="px-4 mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Analytics</h3>
            <div className="space-y-1">
              <Link
                href="/admin/analytics"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin/analytics')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">📈</span>
                Reports
              </Link>
            </div>
          </div>

          {/* Settings Section */}
          <div className="px-4 mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Settings</h3>
            <div className="space-y-1">
              <Link
                href="/admin/notifications"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin/notifications')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">🔔</span>
                Notifications
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
                System
              </Link>
            </div>
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
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Supabase: Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Zoom: Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-4 px-4 pb-4 border-t border-gray-200 pt-4">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            ← Back to Site
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
