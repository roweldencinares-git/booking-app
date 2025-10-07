import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import StaffScheduleManager from '../../../../../components/StaffScheduleManager'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function StaffSchedulePage({ params }: PageProps) {
  const { id } = await params
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get staff member details
  const { data: staff } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (!staff) {
    notFound()
  }

  // Get staff availability
  const { data: availability } = await supabase
    .from('availability')
    .select('*')
    .eq('user_id', id)
    .order('day_of_week', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <a 
                href="/admin/staff"
                className="text-indigo-600 hover:text-indigo-800"
              >
                ← Back to Staff
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="text-lg font-medium text-white">
                  {staff.first_name?.charAt(0)}{staff.last_name?.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {staff.first_name} {staff.last_name}'s Schedule
                </h1>
                <p className="text-gray-600">
                  {staff.email} • {staff.timezone}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Integrations Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Integrations
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage calendar and meeting integrations
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Google Calendar Status */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <svg className="h-6 w-6" viewBox="0 0 24 24">
                        <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="font-medium text-gray-900">Google Calendar</span>
                    </div>
                    {staff.google_calendar_connected ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {staff.google_calendar_connected
                      ? 'Calendar syncing enabled'
                      : 'Connect to sync bookings'}
                  </p>
                </div>

                {/* Zoom Status */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 7h18a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2zm0 2v7h18V9H3zm4 2h2v3H7v-3zm4 0h6v3h-6v-3z"/>
                      </svg>
                      <span className="font-medium text-gray-900">Zoom</span>
                    </div>
                    {staff.zoom_connected ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {staff.zoom_connected
                      ? 'Auto-create Zoom meetings'
                      : 'Connect for video meetings'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <a
                  href="/admin/integrations"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Manage Integrations →
                </a>
              </div>
            </div>

            {/* Schedule Manager */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Weekly Availability
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Set working hours and availability for each day of the week
                </p>
              </div>

              <div className="p-6">
                <StaffScheduleManager
                  staffId={id}
                  staff={staff}
                  availability={availability || []}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}