import DashboardLayoutClient from '@/components/DashboardLayoutClient'

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}