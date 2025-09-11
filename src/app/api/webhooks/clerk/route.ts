import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import createSupabaseClient from '@/lib/supabase'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' }, 
      { status: 500 }
    )
  }

  const payload = await request.text()
  const headers = request.headers

  const wh = new Webhook(webhookSecret)

  let evt: any

  try {
    evt = wh.verify(payload, {
      'svix-id': headers.get('svix-id')!,
      'svix-timestamp': headers.get('svix-timestamp')!,
      'svix-signature': headers.get('svix-signature')!,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return NextResponse.json(
      { error: 'Error verifying webhook' },
      { status: 400 }
    )
  }

  const { id, email_addresses, first_name, last_name } = evt.data
  const eventType = evt.type

  if (eventType === 'user.created') {
    const supabase = createSupabaseClient()

    try {
      const { error } = await supabase
        .from('users')
        .insert([
          {
            clerk_user_id: id,
            email: email_addresses[0]?.email_address,
            first_name: first_name || '',
            last_name: last_name || '',
          },
        ])

      if (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
          { error: 'Error creating user' },
          { status: 500 }
        )
      }

      console.log('User created successfully:', id)
    } catch (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }
  }

  if (eventType === 'user.updated') {
    const supabase = createSupabaseClient()

    try {
      const { error } = await supabase
        .from('users')
        .update({
          email: email_addresses[0]?.email_address,
          first_name: first_name || '',
          last_name: last_name || '',
        })
        .eq('clerk_user_id', id)

      if (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
          { error: 'Error updating user' },
          { status: 500 }
        )
      }

      console.log('User updated successfully:', id)
    } catch (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}