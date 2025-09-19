import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import StaffList from '../../../components/StaffList'
import AddStaffForm from '../../../components/AddStaffForm'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const { userId } = await auth()
  const user = await currentUser()
  
  if (!userId || !user) {
    redirect('/sign-in')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all staff members (temporarily show all including any marked as deleted so we can restore them)
  const { data: staff } = await supabase
    .from('users')
    .select('*')
    .order('first_name', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="mt-2 text-gray-600">
              Manage team members and their availability schedules
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Staff Member */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Add Team Member
                </h2>
                <AddStaffForm />
              </div>
            </div>

            {/* Staff List */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Team Members ({staff?.length || 0})
                  </h2>
                </div>
                <StaffList staff={staff || []} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}