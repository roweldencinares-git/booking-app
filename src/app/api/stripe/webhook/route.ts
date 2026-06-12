import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { sendBookingConfirmation } from '@/lib/emailTemplates'
import { addMinutes } from 'date-fns'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const meta = session.metadata!

    // Get booking type for duration + user_id
    const { data: bookingType } = await supabase
      .from('booking_types')
      .select('*, users(id)')
      .eq('id', meta.bookingTypeId)
      .single()

    if (!bookingType) return NextResponse.json({ error: 'Booking type not found' })

    const startTime = new Date(meta.startTime)
    const endTime = addMinutes(startTime, bookingType.duration)

    const { data: booking } = await supabase.from('bookings').insert({
      booking_type_id: meta.bookingTypeId,
      user_id: bookingType.user_id,
      client_name: meta.clientName,
      client_email: meta.clientEmail,
      client_phone: meta.clientPhone || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'confirmed',
      notes: meta.notes || null,
      stripe_payment_id: session.payment_intent as string,
    }).select().single()

    if (booking) {
      await sendBookingConfirmation(meta.clientEmail, {
        clientName: meta.clientName,
        sessionType: bookingType.name,
        startTime: meta.startTime,
        duration: bookingType.duration,
        zoomJoinUrl: booking.zoom_join_url,
        zoomPassword: booking.zoom_password,
      })
    }
  }

  return NextResponse.json({ received: true })
}
