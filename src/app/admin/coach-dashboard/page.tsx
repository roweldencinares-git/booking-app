import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import ClientCard from '@/components/ClientCard'
import { loadCoachDashboardNexus } from '@/lib/nexus/coachDashboardNexus'

export const dynamic = 'force-dynamic'

export default async function CoachDashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get coach name from Clerk user data
  const coachName = user?.firstName || user?.emailAddresses[0]?.emailAddress.split('@')[0] || 'Coach'

  // Load dashboard data using NEXUS-powered service (9 autonomous layers!)
  const nexusResult = await loadCoachDashboardNexus({
    coachId: userId,
    coachName: coachName
  })

  const dashboardData = nexusResult.success ? nexusResult.data : {
    coachName,
    clients: [],
    insights: ['Unable to load dashboard']
  }

  return (
    <AdminLayout currentPath="/admin/coach-dashboard">
      <div className="p-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {dashboardData.coachName}!
          </h1>
          <p className="text-gray-600">
            Here's an overview of your coaching clients and recent activity
          </p>
        </div>

        {/* NEXUS Metrics Banner */}
        {nexusResult.success && nexusResult.metrics && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌌</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-purple-900 mb-2">NEXUS Framework Active</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-purple-600 font-medium">Performance:</span>
                    <span className="text-purple-800 ml-2">{nexusResult.metrics.duration.toFixed(2)}ms</span>
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">Health Score:</span>
                    <span className="text-purple-800 ml-2">{(nexusResult.metrics.health.score * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">Patterns Learned:</span>
                    <span className="text-purple-800 ml-2">{nexusResult.metrics.learning.patternsIdentified}</span>
                  </div>
                </div>
                {nexusResult.optimizations && nexusResult.optimizations.length > 0 && (
                  <div className="mt-2 text-xs text-purple-700">
                    💡 {nexusResult.optimizations.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Insights Banner */}
        {dashboardData.insights.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Business Insights</h3>
                <ul className="space-y-1">
                  {dashboardData.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-blue-700">
                      • {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Clients Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Clients ({dashboardData.clients.length})
          </h2>

          {dashboardData.clients.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <span className="text-6xl mb-4 block">👥</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
              <p className="text-gray-600">
                Clients will appear here once they book sessions with you
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/meetings"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <span className="text-2xl">📅</span>
              <div>
                <h4 className="font-medium text-gray-900">View Schedule</h4>
                <p className="text-sm text-gray-600">See all upcoming sessions</p>
              </div>
            </a>
            <a
              href="/admin/availability"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <span className="text-2xl">🕒</span>
              <div>
                <h4 className="font-medium text-gray-900">Set Availability</h4>
                <p className="text-sm text-gray-600">Manage your calendar</p>
              </div>
            </a>
            <a
              href="/admin/analytics"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-medium text-gray-900">View Analytics</h4>
                <p className="text-sm text-gray-600">Track your progress</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
