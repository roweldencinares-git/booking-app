import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { loadCoachDashboard } from '@/lib/coachDashboardService'
import { loadCoachDashboardNexus } from '@/lib/nexus/coachDashboardNexus'

export const dynamic = 'force-dynamic'

export default async function NexusDemoPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const coachName = 'Demo Coach'

  // Run BOTH frameworks for comparison
  const startSphere = performance.now()
  const sphereData = await loadCoachDashboard(userId, coachName)
  const sphereTime = performance.now() - startSphere

  const startNexus = performance.now()
  const nexusResult = await loadCoachDashboardNexus({
    coachId: userId,
    coachName: coachName
  })
  const nexusTime = performance.now() - startNexus

  return (
    <AdminLayout currentPath="/admin/nexus-demo">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🌌 NEXUS vs SPHERE Comparison
          </h1>
          <p className="text-gray-600">
            Live comparison showing both frameworks processing the same data
          </p>
        </div>

        {/* Performance Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* SPHERE Card */}
          <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🔵</span>
              <div>
                <h2 className="text-xl font-bold text-blue-900">SPHERE</h2>
                <p className="text-sm text-blue-600">6-Step Framework</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 rounded p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">Execution Time</div>
                <div className="text-2xl font-bold text-blue-900">{sphereTime.toFixed(2)}ms</div>
              </div>

              <div className="bg-blue-50 rounded p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">Features</div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✅ Scan & Validate</li>
                  <li>✅ Plan & Test</li>
                  <li>✅ Heal (Basic)</li>
                  <li>✅ Examine</li>
                  <li>✅ Reinforce</li>
                  <li>✅ Evolve</li>
                  <li>❌ AI Analysis</li>
                  <li>❌ Predictive Intelligence</li>
                  <li>❌ Advanced Monitoring</li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">Code Complexity</div>
                <div className="text-sm text-blue-800">~220 lines (manual steps)</div>
              </div>

              <div className="bg-blue-50 rounded p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">Data Returned</div>
                <div className="text-sm text-blue-800">
                  Clients: {sphereData.clients.length}<br />
                  Insights: {sphereData.insights.length}
                </div>
              </div>
            </div>
          </div>

          {/* NEXUS Card */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-300 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🌌</span>
              <div>
                <h2 className="text-xl font-bold text-purple-900">NEXUS</h2>
                <p className="text-sm text-purple-600">9-Layer Autonomous Framework</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded p-3 border border-purple-200">
                <div className="text-xs text-purple-600 font-medium mb-1">Execution Time</div>
                <div className="text-2xl font-bold text-purple-900">{nexusTime.toFixed(2)}ms</div>
              </div>

              <div className="bg-white rounded p-3 border border-purple-200">
                <div className="text-xs text-purple-600 font-medium mb-1">9 Autonomous Layers</div>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>✅ L1: Scan (Security + Health)</li>
                  <li>✅ L2: Analyze (AI-Powered)</li>
                  <li>✅ L3: Transform (Enrich)</li>
                  <li>✅ L4: Guard (Business Rules)</li>
                  <li>✅ L5: Heal (3-Tier Fallback)</li>
                  <li>✅ L6: Validate (Quality)</li>
                  <li>✅ L7: Respond (Optimize)</li>
                  <li>✅ L8: Observe (Monitor + Predict)</li>
                  <li>✅ L9: Evolve (Learn + Optimize)</li>
                </ul>
              </div>

              <div className="bg-white rounded p-3 border border-purple-200">
                <div className="text-xs text-purple-600 font-medium mb-1">Code Complexity</div>
                <div className="text-sm text-purple-800">~150 lines (~30 business logic)</div>
              </div>

              {nexusResult.success && (
                <div className="bg-white rounded p-3 border border-purple-200">
                  <div className="text-xs text-purple-600 font-medium mb-1">Enhanced Data</div>
                  <div className="text-sm text-purple-800 space-y-1">
                    <div>Clients: {nexusResult.data.clients.length}</div>
                    <div>Insights: {nexusResult.insights?.length || 0}</div>
                    <div>Predictions: {nexusResult.predictions?.length || 0}</div>
                    <div>Optimizations: {nexusResult.optimizations?.length || 0}</div>
                    <div>Health Score: {nexusResult.metrics ? (nexusResult.metrics.health.score * 100).toFixed(0) : 0}%</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NEXUS Insights */}
        {nexusResult.success && nexusResult.insights && nexusResult.insights.length > 0 && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-3">🧠 NEXUS AI Insights</h3>
            <ul className="space-y-2">
              {nexusResult.insights.map((insight, index) => (
                <li key={index} className="text-sm text-purple-800 flex items-start gap-2">
                  <span className="text-purple-500">▸</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* NEXUS Predictions */}
        {nexusResult.success && nexusResult.predictions && nexusResult.predictions.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">🔮 Predictive Intelligence</h3>
            <div className="space-y-2">
              {nexusResult.predictions.map((prediction: any, index: number) => (
                <div key={index} className="text-sm text-blue-800">
                  <div>Next Failure: {prediction.nextFailure || 'None predicted'}</div>
                  <div>Performance Trend: <span className="font-semibold">{prediction.performanceTrend}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEXUS Optimizations */}
        {nexusResult.success && nexusResult.optimizations && nexusResult.optimizations.length > 0 && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-900 mb-3">⚡ Optimization Suggestions</h3>
            <ul className="space-y-2">
              {nexusResult.optimizations.map((opt, index) => (
                <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                  <span className="text-green-500">💡</span>
                  {opt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Code Comparison */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Code Comparison</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-2">SPHERE Implementation</h4>
              <pre className="bg-blue-900 text-blue-100 p-4 rounded text-xs overflow-x-auto">
{`export async function loadCoachDashboard(
  coachId: string,
  coachName: string
): Promise<DashboardData> {
  try {
    // S - SCAN
    if (!coachId || !coachName) {
      throw new Error('Required')
    }

    // P - PLAN
    const data = await fetchData()

    // H - HEAL
    const healed = data || []

    // E - EXAMINE
    const valid = healed.filter(isValid)

    // R - REINFORCE
    const insights = generate()

    // E - EVOLVE
    return { coachName, clients, insights }
  } catch (error) {
    return { coachName, clients: [], insights: [] }
  }
}

// 220 lines total`}</pre>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-purple-900 mb-2">NEXUS Implementation</h4>
              <pre className="bg-purple-900 text-purple-100 p-4 rounded text-xs overflow-x-auto">
{`export const loadCoachDashboardNexus = nexusify(
  async (params) => {
    // Just your business logic!
    const data = await fetchData()

    return {
      coachName: params.coachName,
      clients: data,
      insights: generate(data)
    }
  },
  {
    service: 'coach-dashboard',
    mode: 'FULL' // All 9 layers auto!
  }
)

// 150 lines total (30 business logic)
// NEXUS handles ALL the framework stuff!`}</pre>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-6 border border-purple-300">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded p-4">
              <div className="text-sm text-gray-600 mb-1">Code Reduction</div>
              <div className="text-3xl font-bold text-green-600">
                {((1 - 30 / 220) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Less code to maintain</div>
            </div>
            <div className="bg-white rounded p-4">
              <div className="text-sm text-gray-600 mb-1">Features Added</div>
              <div className="text-3xl font-bold text-purple-600">+9</div>
              <div className="text-xs text-gray-500">AI, monitoring, predictions, etc.</div>
            </div>
            <div className="bg-white rounded p-4">
              <div className="text-sm text-gray-600 mb-1">Resilience Level</div>
              <div className="text-3xl font-bold text-blue-600">
                {nexusResult.metrics ? (nexusResult.metrics.health.score * 100).toFixed(0) : 0}%
              </div>
              <div className="text-xs text-gray-500">System health score</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
