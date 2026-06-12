'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

const nav = [
  { href: '/rr/dashboard',   label: 'Dashboard',   icon: '🏠' },
  { href: '/rr/properties',  label: 'Properties',  icon: '🌐' },
  { href: '/rr/leads',       label: 'Lead Inbox',  icon: '📥' },
  { href: '/rr/clients',     label: 'Clients',     icon: '🤝' },
]

export default function RrLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded && !user) router.push('/sign-in')
  }, [isLoaded, user, router])

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-base">Rank & Rent OS</p>
          <p className="text-xs text-gray-400 mt-0.5">Property Management</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>{icon}</span>{label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-0.5">
          <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            ← Admin
          </Link>
          <Link href="/crm" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            ← CRM
          </Link>
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center gap-2">
          <UserButton afterSignOutUrl="/" />
          <p className="text-xs text-gray-500 truncate">{user.firstName || 'Owner'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
