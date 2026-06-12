'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're booked!</h1>
        <p className="text-gray-500 mb-6">Payment confirmed. Check your email for a confirmation with your Zoom link.</p>
        <div className="flex flex-col gap-3">
          <Link href="/portal/sessions" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700">
            View My Sessions
          </Link>
          <Link href="/" className="text-gray-500 text-sm hover:text-gray-700">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
