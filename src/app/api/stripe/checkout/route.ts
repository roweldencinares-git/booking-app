import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await req.json()

  const { bookingTypeId, clientName, clientEmail, clientPhone, startTime, notes, timezone } = body

  // Get booking type for price/name
  const { data: bookingType } = await supabase
    .from('booking_types')
    .select('*')
    .eq('id', bookingTypeId)
    .single()

  if (!bookingType || !bookingType.price || bookingType.price <= 0) {
    return NextResponse.json({ error: 'No price set for this session type' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meetings.spearity.com'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: clientEmail,
    line_items: [{
      price_data: {
        currency: 'cad',
        unit_amount: Math.round(bookingType.price * 100),
        product_data: {
          name: bookingType.name,
          description: `${bookingType.duration} minute coaching session`,
        },
      },
      quantity: 1,
    }],
    metadata: {
      bookingTypeId,
      clientName,
      clientEmail,
      clientPhone: clientPhone || '',
      startTime,
      notes: notes || '',
      timezone,
    },
    success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/?cancelled=1`,
  })

  return NextResponse.json({ url: session.url })
}
