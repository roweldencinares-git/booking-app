import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }


  // Get booking statistics
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: staff } = await supabase
    .from('staff')
    .select('*')

  // Calculate analytics
  const totalBookings = bookings?.length || 0
  const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
  const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0
  const pendingBookings = bookings?.filter(b => b.status === 'confirmed').length || 0

  // Revenue calculation (assuming booking_types have prices)
  const totalRevenue = completedBookings * 100 // Placeholder calculation

  // Recent bookings for activity feed
  const recentBookings = bookings?.slice(0, 5) || []

  return (
    <AdminLayout currentPath="/admin/analytics">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Overview of your booking performance and statistics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-lg">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-lg">❌</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{cancelledBookings}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
            </div>
            <div className="p-6">
              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{booking.client_name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.start_time).toLocaleDateString()} at {new Date(booking.start_time).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No bookings yet</p>
              )}
            </div>
          </div>

          {/* Staff Performance */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Staff Overview</h2>
            </div>
            <div className="p-6">
              {staff && staff.length > 0 ? (
                <div className="space-y-4">
                  {staff.map((member, index) => {
                    const memberBookings = bookings?.filter(b => b.staff_id === member.id) || []
                    return (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 text-sm">👤</span>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.title}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{memberBookings.length} bookings</p>
                          <p className="text-xs text-gray-600">
                            {memberBookings.filter(b => b.status === 'completed').length} completed
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No staff members yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}