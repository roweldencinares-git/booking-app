import { NextRequest, NextResponse } from 'next/server'
import { nexusOperation } from '@/lib/nexus/core'

export async function POST(request: NextRequest) {
  const { mode } = await request.json()

  // Run NEXUS with test data
  const result = await nexusOperation(
    {
      testData: 'NEXUS Framework Test',
      timestamp: new Date().toISOString(),
      mode: mode || 'STANDARD'
    },
    async (transformedData) => {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 50))

      return {
        message: 'NEXUS test completed successfully!',
        input: transformedData,
        processed: true,
        timestamp: new Date().toISOString()
      }
    },
    {
      service: 'nexus-test',
      userId: 'test-user',
      mode: mode || 'STANDARD'
    }
  )

  return NextResponse.json(result)
}
