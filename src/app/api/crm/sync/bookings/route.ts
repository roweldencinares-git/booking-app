import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Pull all bookings from the booking system
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('client_name, client_email, client_phone, status, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!bookings?.length) return NextResponse.json({ created: 0, updated: 0, skipped: 0 })

  let created = 0
  let updated = 0
  let skipped = 0

  for (const booking of bookings) {
    if (!booking.client_email) { skipped++; continue }

    const [firstName, ...rest] = (booking.client_name || 'Unknown').split(' ')
    const lastName = rest.join(' ') || '—'

    // Check if contact already exists
    const { data: existing } = await supabase
      .from('crm_contacts')
      .select('id, phone')
      .eq('email', booking.client_email.toLowerCase())
      .single()

    if (existing) {
      // Update phone if we now have it and didn't before
      if (booking.client_phone && !existing.phone) {
        await supabase.from('crm_contacts').update({ phone: booking.client_phone }).eq('id', existing.id)
        updated++
      } else {
        skipped++
      }
    } else {
      await supabase.from('crm_contacts').insert({
        first_name: firstName,
        last_name: lastName,
        email: booking.client_email.toLowerCase(),
        phone: booking.client_phone || null,
        type: booking.status === 'completed' ? 'customer' : 'lead',
      })
      created++
    }
  }

  return NextResponse.json({ created, updated, skipped })
}
