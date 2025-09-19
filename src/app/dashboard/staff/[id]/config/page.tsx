import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import StaffConfiguration from '../../../../../components/StaffConfiguration'

export const dynamic = 'force-dynamic'

interface ConfigPageProps {
  params: Promise<{ id: string }>
}

export default async function StaffConfigPage({ params }: ConfigPageProps) {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    redirect('/sign-in')
  }

  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get staff member details
  const { data: staff, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .neq('status', 'deleted')
    .single()

  if (error || !staff) {
    redirect('/dashboard/staff')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Staff Configuration</h1>
                <p className="mt-2 text-gray-600">
                  Configure settings for {staff.first_name} {staff.last_name}
                </p>
              </div>
              <a
                href="/dashboard/staff"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back to Staff
              </a>
            </div>
          </div>

          {/* Configuration Component */}
          <StaffConfiguration staffId={id} staff={staff} />
        </div>
      </div>
    </div>
  )
}