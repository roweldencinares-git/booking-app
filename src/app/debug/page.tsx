import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug User Information</h1>

        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg mb-2">User ID:</h2>
            <p className="font-mono bg-gray-100 p-2 rounded">{userId}</p>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-2">Session Claims:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(sessionClaims, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-2">Expected Admin Email:</h2>
            <p className="font-mono bg-yellow-100 p-2 rounded">roweld.encinares@spearity.com</p>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-2">Email Extraction Attempts:</h2>
            <div className="space-y-2">
              <p><strong>sessionClaims?.email:</strong> <span className="font-mono">{sessionClaims?.email || 'undefined'}</span></p>
              <p><strong>sessionClaims?.primaryEmailAddress:</strong> <span className="font-mono">{sessionClaims?.primaryEmailAddress || 'undefined'}</span></p>
              <p><strong>sessionClaims?.primary_email_address:</strong> <span className="font-mono">{sessionClaims?.primary_email_address || 'undefined'}</span></p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              Check the email values above. One of them should match "roweld.encinares@spearity.com" for admin access to work.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}