import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Redirect to admin system page where all dashboard content now lives
  redirect('/admin/system')
}