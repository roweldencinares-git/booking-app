import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import UserSettingsForm from '@/components/UserSettingsForm'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get user from database
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (!user) {
    return (
      <AdminLayout currentPath="/admin/settings">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">User Not Found</h2>
            <p className="text-red-700">Your user profile could not be loaded.</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const initialSettings = {
    timezone: user.timezone || 'America/Chicago',
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email || '',
    defaultMeetingDuration: 30
  }

  return (
    <AdminLayout currentPath="/admin/settings">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile and preferences</p>
        </div>

        <div className="max-w-4xl">
          <UserSettingsForm initialSettings={initialSettings} />
        </div>
      </div>
    </AdminLayout>
  )
}