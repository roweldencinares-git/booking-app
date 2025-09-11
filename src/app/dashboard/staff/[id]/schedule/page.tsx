import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import StaffScheduleManager from '../../../../../components/StaffScheduleManager'
import GoogleCalendarIntegration from '../../../../../components/GoogleCalendarIntegration'

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
                href="/dashboard/staff"
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
            {/* Google Calendar Integration */}
            <GoogleCalendarIntegration staff={staff} />

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