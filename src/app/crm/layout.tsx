'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const nav = [
  { href: '/crm/dashboard', label: 'Dashboard', emoji: '🏠' },
  { href: '/crm/contacts', label: 'Contacts', emoji: '👤' },
  { href: '/crm/companies', label: 'Companies', emoji: '🏢' },
  { href: '/crm/deals', label: 'Deals', emoji: '💰' },
  { href: '/crm/tasks', label: 'Tasks', emoji: '✅' },
  { href: '/crm/reports', label: 'Reports', emoji: '📈' },
]

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (isLoaded && !user) router.push('/sign-in')
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 relative flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 border border-gray-200"
        >
          <svg className={`w-3 h-3 text-gray-500 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Brand */}
        <div className={`p-5 border-b border-gray-100 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <span className="text-xl">📊</span>
          ) : (
            <>
              <p className="text-lg font-bold text-gray-900">Rowel CRM</p>
              <p className="text-xs text-gray-400 mt-0.5">Yours. Always.</p>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {nav.map(({ href, label, emoji }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <span className="text-base">{emoji}</span>
                {!collapsed && label}
              </Link>
            )
          })}
        </nav>

        {/* Admin link */}
        {!collapsed && (
          <div className="px-3 pb-2">
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
              <span>←</span> Back to Admin
            </Link>
          </div>
        )}

        {/* User */}
        <div className={`p-4 border-t border-gray-100 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <UserButton afterSignOutUrl="/" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.firstName || user.emailAddresses[0]?.emailAddress}</p>
              <p className="text-xs text-gray-400">Owner</p>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
