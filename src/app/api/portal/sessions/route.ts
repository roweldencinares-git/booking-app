import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

  const { data, error } = await supabase
    .from('bookings')
    .select('*, booking_types(name, duration, price)')
    .eq('client_email', email)
    .order('start_time', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
