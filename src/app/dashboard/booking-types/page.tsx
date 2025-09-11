import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import BookingTypesList from '../../../components/BookingTypesList'
import CreateBookingTypeForm from '../../../components/CreateBookingTypeForm'

export default async function BookingTypesPage() {
  const { userId } = await auth()
  const user = await currentUser()
  
  if (!userId || !user) {
    redirect('/sign-in')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get user from database, create if doesn't exist
  let { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  // If user doesn't exist, create them
  if (!dbUser) {
    const { data: newUser } = await supabase
      .from('users')
      .insert([{
        clerk_user_id: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        first_name: user.firstName || '',
        last_name: user.lastName || '',
      }])
      .select('id')
      .single()
    
    dbUser = newUser
  }

  // Get ALL booking types (admin can see everything)
  const { data: bookingTypes } = await supabase
    .from('booking_types')
    .select(`
      *,
      users!inner(first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Service Types</h1>
            <p className="mt-2 text-gray-600">
              Create and manage the different types of appointments you offer
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create New Service Type */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Add New Service
                </h2>
                <CreateBookingTypeForm userId={dbUser?.id} />
              </div>
            </div>

            {/* Existing Service Types */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Your Services
                  </h2>
                </div>
                <BookingTypesList bookingTypes={bookingTypes || []} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}