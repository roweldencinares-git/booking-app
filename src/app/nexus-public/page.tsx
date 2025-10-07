import { loadCoachDashboard } from '@/lib/coachDashboardService'
import { loadCoachDashboardNexus } from '@/lib/nexus/coachDashboardNexus'

export default async function NexusPublicPage() {
  const coachName = 'Demo Coach'
  const coachId = 'demo-123'

  // Run both for comparison
  const startSphere = performance.now()
  const sphereData = await loadCoachDashboard(coachId, coachName)
  const sphereTime = performance.now() - startSphere

  const startNexus = performance.now()
  const nexusResult = await loadCoachDashboardNexus({
    coachId,
    coachName
  })
  const nexusTime = performance.now() - startNexus

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🌌 NEXUS Framework Demo (No Auth)</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* SPHERE */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">🔵 SPHERE</h2>
            <div className="text-4xl font-bold text-blue-600 mb-2">{sphereTime.toFixed(2)}ms</div>
            <div className="text-sm text-blue-700">6 manual steps</div>
          </div>

          {/* NEXUS */}
          <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-4">🌌 NEXUS</h2>
            <div className="text-4xl font-bold text-purple-600 mb-2">{nexusTime.toFixed(2)}ms</div>
            <div className="text-sm text-purple-700">9 autonomous layers</div>
          </div>
        </div>

        {/* NEXUS Metrics */}
        {nexusResult.success && nexusResult.metrics && (
          <div className="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">📊 NEXUS Metrics</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Duration</div>
                <div className="text-2xl font-bold">{nexusResult.metrics.duration.toFixed(2)}ms</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Health</div>
                <div className="text-2xl font-bold">{(nexusResult.metrics.health.score * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Patterns</div>
                <div className="text-2xl font-bold">{nexusResult.metrics.learning.patternsIdentified}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Insights</div>
                <div className="text-2xl font-bold">{nexusResult.insights?.length || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        {nexusResult.insights && nexusResult.insights.length > 0 && (
          <div className="mt-6 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-3">🧠 NEXUS Insights</h3>
            <ul className="space-y-2">
              {nexusResult.insights.map((insight, i) => (
                <li key={i} className="text-sm">▸ {insight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Data */}
        <div className="mt-6 bg-white rounded-lg border p-6">
          <h3 className="text-lg font-bold mb-4">📦 Data Returned</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">SPHERE Data</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify(sphereData, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">NEXUS Data</h4>
              <pre className="bg-gray-900 text-purple-400 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify(nexusResult.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>✅ No authentication required for this demo page</p>
          <p className="mt-2">Check your browser console to see NEXUS layers executing!</p>
        </div>
      </div>
    </div>
  )
}
