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
      <div className="min-h-screen bg-accent-grey-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-accent-grey-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r-4 border-primary-teal">
        {/* Header */}
        <div className="p-6 border-b-2 border-primary-teal bg-gradient-to-r from-primary-teal to-primary-blue">
          <Link href="/" className="text-xl font-bold text-white">
            Admin Dashboard
          </Link>
          <p className="text-sm text-white/90 mt-1">Management Console</p>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-accent-grey-200 bg-accent-grey-50">
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
              <p className="text-sm font-medium text-primary-teal truncate">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-accent-grey-500 truncate">
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
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/admin')
                    ? 'bg-primary-blue text-white'
                    : 'text-accent-grey-700 hover:bg-accent-light-blue hover:text-primary-teal'
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
                    ? 'bg-primary-blue text-white'
                    : 'text-accent-grey-700 hover:bg-accent-light-blue hover:text-primary-teal'
                }`}
              >
                <span className="mr-3">📅</span>
                All Meetings
              </Link>
              <Link
                href="/admin/recaps"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin/recaps')
                    ? 'bg-primary-blue text-white'
                    : 'text-accent-grey-700 hover:bg-accent-light-blue hover:text-primary-teal'
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
                    ? 'bg-primary-blue text-white'
                    : 'text-accent-grey-700 hover:bg-accent-light-blue hover:text-primary-teal'
                }`}
              >
                <span className="mr-3">👥</span>
                Staff
              </Link>
              <Link
                href="/admin/booking-types"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin/booking-types')
                    ? 'bg-primary-blue text-white'
                    : 'text-accent-grey-700 hover:bg-accent-light-blue hover:text-primary-teal'
                }`}
              >
                <span className="mr-3">📋</span>
                Services
              </Link>
              <Link
                href="/admin/availability"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin/availability')
                    ? 'bg-primary-blue text-white'
                    : 'text-accent-grey-700 hover:bg-accent-light-blue hover:text-primary-teal'
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
                    ? 'bg-primary-blue text-white'
                    : 'text-accent-grey-700 hover:bg-accent-light-blue hover:text-primary-teal'
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
                    ? 'bg-primary-blue text-white'
                    : 'text-accent-grey-700 hover:bg-accent-light-blue hover:text-primary-teal'
                }`}
              >
                <span className="mr-3">🔔</span>
                Notifications
              </Link>
              <Link
                href="/admin/settings"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin/settings')
                    ? 'bg-primary-blue text-white'
                    : 'text-accent-grey-700 hover:bg-accent-light-blue hover:text-primary-teal'
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
          <div className="bg-accent-grey-50 rounded-lg p-4 border border-accent-grey-200">
            <h4 className="text-sm font-medium text-primary-teal mb-3">System Status</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-accent-grey-700">Clerk: Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-accent-grey-700">Supabase: Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-accent-grey-700">Zoom: Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-4 px-4 pb-4 border-t border-accent-grey-200 pt-4">
          <Link
            href="/"
            className="text-sm text-accent-grey-500 hover:text-primary-teal flex items-center gap-2 transition-colors"
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
