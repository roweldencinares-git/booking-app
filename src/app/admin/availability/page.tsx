import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import UnifiedAvailability from '@/components/UnifiedAvailability'

export const dynamic = 'force-dynamic'

export default async function AvailabilityPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get current user's data
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (!user) {
    redirect('/sign-in')
  }

  // Get user's availability
  const { data: availability } = await supabase
    .from('availability')
    .select('*')
    .eq('user_id', user.id)
    .order('day_of_week', { ascending: true })

  return (
    <AdminLayout currentPath="/admin/availability">
      <UnifiedAvailability
        staffId={user.id}
        staff={{
          id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          timezone: user.timezone || 'America/Chicago',
          google_calendar_connected: user.google_calendar_connected || false,
          zoom_connected: user.zoom_connected || false
        }}
        initialAvailability={availability || []}
      />
    </AdminLayout>
  )
}
