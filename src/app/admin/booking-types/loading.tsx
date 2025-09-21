export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create New Service Type Loading */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Services List Loading */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="divide-y divide-gray-200">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}