import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">BookingApp</h1>
            </div>
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2"
                >
                  Admin
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-6xl">
            Book with our
            <span className="text-blue-600"> expert coaches</span>
          </h2>
          <p className="mt-6 text-xl text-gray-500 max-w-3xl mx-auto">
            Choose from our team of professional coaches and schedule a session that fits your needs.
          </p>
        </div>

        {/* Coaches/Staff Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Sample Coach Cards - In real app, this would be dynamic from database */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Darren Fisher</h3>
                  <p className="text-gray-600">CEO</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "My passion is seeing people dream and go after it. Too many adults are living in fear, stress and basically surviving when they don't have to." - CEO/Founder focused on helping entrepreneurs overcome challenges.
              </p>
              <div className="flex justify-end mb-4">
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">Available</span>
              </div>
              <Link
                href="/darren-fisher"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700 transition-colors block"
              >
                Book Session
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Michael Rampolla</h3>
                  <p className="text-gray-600">Strategist & Consultant</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Specializes in helping leaders solve their complex problems and craft strategic plans to achieve their goals. Finds reward in helping others "do better what they love to do."
              </p>
              <div className="flex justify-end mb-4">
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">Available</span>
              </div>
              <Link
                href="/michael-rampolla"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700 transition-colors block"
              >
                Book Session
              </Link>
            </div>
          </div>

        </div>

        {/* Admin Access */}
        <SignedIn>
          <div className="text-center border-t pt-8">
            <p className="text-gray-600 mb-4">Staff or Admin?</p>
            <div className="flex justify-center gap-4">
              <Link
                href="/dashboard"
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Admin Panel
              </Link>
            </div>
          </div>
        </SignedIn>
      </main>
    </div>
  )
}
