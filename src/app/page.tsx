import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-light-blue to-accent-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-primary-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-teal">BookingApp</h1>
            </div>
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton>
                  <button className="bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-teal transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/admin"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Dashboard
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
          <h2 className="text-4xl font-extrabold text-primary-teal sm:text-6xl">
            Book with our
            <span className="text-primary-blue"> expert coaches</span>
          </h2>
          <p className="mt-6 text-xl text-accent-grey-700 max-w-3xl mx-auto">
            Choose from our team of professional coaches and schedule a session that fits your needs.
          </p>
        </div>

        {/* Coaches/Staff Selection */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mb-16">
          {/* Sample Coach Cards - In real app, this would be dynamic from database */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-t-4 border-primary-teal">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-accent-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-primary-teal">Darren Fisher</h3>
                  <p className="text-accent-grey-500">CEO</p>
                </div>
              </div>
              <p className="text-accent-grey-700 mb-4">
                "My passion is seeing people dream and go after it. Too many adults are living in fear, stress and basically surviving when they don't have to." - CEO/Founder focused on helping entrepreneurs overcome challenges.
              </p>
              <div className="flex justify-end mb-4">
                <span className="text-sm text-success bg-green-100 px-2 py-1 rounded">Available</span>
              </div>
              <Link
                href="/darren-fisher"
                className="w-full bg-primary-blue text-white px-4 py-2 rounded-lg text-center hover:bg-primary-teal transition-colors block"
              >
                Book Session
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-t-4 border-primary-orange">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-accent-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-primary-teal">Michael Rampolla</h3>
                  <p className="text-accent-grey-500">Strategist & Consultant</p>
                </div>
              </div>
              <p className="text-accent-grey-700 mb-4">
                Specializes in helping leaders solve their complex problems and craft strategic plans to achieve their goals. Finds reward in helping others "do better what they love to do."
              </p>
              <div className="flex justify-end mb-4">
                <span className="text-sm text-success bg-green-100 px-2 py-1 rounded">Available</span>
              </div>
              <Link
                href="/michael-rampolla"
                className="w-full bg-primary-blue text-white px-4 py-2 rounded-lg text-center hover:bg-primary-teal transition-colors block"
              >
                Book Session
              </Link>
            </div>
          </div>
          </div>
        </div>
      </main>
    </div>
  )
}
