'use client'

import DashboardLayout from './DashboardLayout'

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  return <DashboardLayout>{children}</DashboardLayout>
}