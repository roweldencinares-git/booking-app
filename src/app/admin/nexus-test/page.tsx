'use client'

import { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'

export default function NexusTestPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])

  const runTest = async (mode: 'FULL' | 'STANDARD' | 'LITE') => {
    setLoading(true)
    setTestResults(null)
    setConsoleOutput([])

    // Intercept console.log
    const originalLog = console.log
    const logs: string[] = []

    console.log = (...args) => {
      const message = args.join(' ')
      logs.push(message)
      setConsoleOutput((prev) => [...prev, message])
      originalLog(...args)
    }

    try {
      const response = await fetch('/api/nexus-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      })

      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      console.log = originalLog
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 NEXUS Framework Test Console
          </h1>
          <p className="text-gray-600">
            Run NEXUS in different modes and see all 9 layers in action
          </p>
        </div>

        {/* Test Buttons */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => runTest('LITE')}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            🔵 Run NEXUS-LITE
            <div className="text-xs font-normal mt-1">Layers 1, 3, 5, 7</div>
          </button>

          <button
            onClick={() => runTest('STANDARD')}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            🟣 Run NEXUS-STANDARD
            <div className="text-xs font-normal mt-1">Layers 1-8</div>
          </button>

          <button
            onClick={() => runTest('FULL')}
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            🌌 Run NEXUS-FULL
            <div className="text-xs font-normal mt-1">All 9 Layers</div>
          </button>
        </div>

        {loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
              <span className="text-yellow-800 font-medium">Running NEXUS test...</span>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Test Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded p-4">
                  <div className="text-sm text-gray-600 mb-1">Success</div>
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.success ? 'YES' : 'NO'}
                  </div>
                </div>
                <div className="bg-white rounded p-4">
                  <div className="text-sm text-gray-600 mb-1">Duration</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.metrics?.duration.toFixed(2)}ms
                  </div>
                </div>
                <div className="bg-white rounded p-4">
                  <div className="text-sm text-gray-600 mb-1">Health</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {(testResults.metrics?.health.score * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-white rounded p-4">
                  <div className="text-sm text-gray-600 mb-1">Patterns</div>
                  <div className="text-2xl font-bold text-pink-600">
                    {testResults.metrics?.learning.patternsIdentified}
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            {testResults.insights && testResults.insights.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">🧠 AI Insights</h3>
                <ul className="space-y-2">
                  {testResults.insights.map((insight: string, index: number) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-blue-500">▸</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Predictions */}
            {testResults.predictions && testResults.predictions.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-3">🔮 Predictions</h3>
                {testResults.predictions.map((prediction: any, index: number) => (
                  <div key={index} className="text-sm text-purple-800 space-y-1">
                    <div>Next Failure: {prediction.nextFailure || 'None predicted'}</div>
                    <div>
                      Performance Trend:{' '}
                      <span className="font-semibold">{prediction.performanceTrend}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Optimizations */}
            {testResults.optimizations && testResults.optimizations.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-green-900 mb-3">⚡ Optimizations</h3>
                <ul className="space-y-2">
                  {testResults.optimizations.map((opt: string, index: number) => (
                    <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                      <span className="text-green-500">💡</span>
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data */}
            {testResults.data && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">📦 Returned Data</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto font-mono">
                  {JSON.stringify(testResults.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Console Output */}
        {consoleOutput.length > 0 && (
          <div className="mt-6 bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">🖥️ Console Output (Live)</h3>
            <div className="font-mono text-xs text-green-400 space-y-1 max-h-96 overflow-y-auto">
              {consoleOutput.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layer Guide */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📚 NEXUS Layer Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-semibold text-purple-900">Layers 1-3: Input Processing</div>
              <div className="text-gray-700">L1: Scan & Security</div>
              <div className="text-gray-700">L2: AI Analysis</div>
              <div className="text-gray-700">L3: Transform & Enrich</div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-blue-900">Layers 4-6: Validation</div>
              <div className="text-gray-700">L4: Guard & Protect</div>
              <div className="text-gray-700">L5: Heal & Recover</div>
              <div className="text-gray-700">L6: Validate Quality</div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-pink-900">Layers 7-9: Intelligence</div>
              <div className="text-gray-700">L7: Respond & Optimize</div>
              <div className="text-gray-700">L8: Observe & Predict</div>
              <div className="text-gray-700">L9: Evolve & Learn</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
