import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🚫</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access the admin panel
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Admin Access Required
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Only authorized administrators can access this area.
                      If you believe this is an error, please contact support.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Home
              </Link>

              <Link
                href="/dashboard"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </Link>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              <p>This incident has been logged for security purposes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}