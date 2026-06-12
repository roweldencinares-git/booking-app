'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

const nav = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/portal/sessions',  label: 'My Sessions', icon: '📅' },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded && !user) router.push('/sign-in?redirect_url=/portal/dashboard')
  }, [isLoaded, user, router])

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-indigo-600 text-lg">Spearity</span>
            <nav className="flex gap-1">
              {nav.map(({ href, label, icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    <span>{icon}</span>{label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Hi, {user.firstName || user.emailAddresses[0]?.emailAddress}</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
