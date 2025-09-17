import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import BookingTypesList from '../../../components/BookingTypesList'
import CreateBookingTypeForm from '../../../components/CreateBookingTypeForm'

// Force dynamic rendering to prevent build-time issues
export const dynamic = 'force-dynamic'

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

  // Ensure user exists in database via API call
  try {
    const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'}/api/sync-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerk_user_id: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        first_name: user.firstName || '',
        last_name: user.lastName || '',
      })
    })
  } catch (syncError) {
    console.error('Error syncing user:', syncError)
  }

  // Get user from database - try by clerk_user_id first, then by email as fallback
  let { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('id, clerk_user_id')
    .eq('clerk_user_id', userId)
    .single()

  // If not found by clerk_user_id, try by email and update clerk_user_id
  if (!dbUser && user.emailAddresses[0]?.emailAddress) {
    const { data: userByEmail } = await supabase
      .from('users')
      .select('id, clerk_user_id')
      .eq('email', user.emailAddresses[0].emailAddress)
      .single()

    if (userByEmail) {
      // Update the clerk_user_id for this user
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ clerk_user_id: userId })
        .eq('id', userByEmail.id)
        .select('id')
        .single()

      dbUser = updatedUser
    }
  }

  if (userError && userError.code !== 'PGRST116') { // PGRST116 = not found, which is okay
    console.error('Error fetching user:', userError, 'for userId:', userId)
  }

  if (!dbUser) {
    console.error('Failed to create or find user in database for userId:', userId)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Database Error</h1>
          <p className="text-gray-600 mt-2">Unable to access user data. Please try again.</p>
        </div>
      </div>
    )
  }

  // Get only this user's booking types for faster loading
  const { data: bookingTypes, error: bookingTypesError } = await supabase
    .from('booking_types')
    .select(`
      *,
      users!inner(first_name, last_name, email)
    `)
    .eq('user_id', dbUser.id)
    .order('created_at', { ascending: false })

  if (bookingTypesError) {
    console.error('Error fetching booking types:', bookingTypesError, 'for user:', dbUser.id)
  }

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
                <CreateBookingTypeForm userId={dbUser.id} />
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