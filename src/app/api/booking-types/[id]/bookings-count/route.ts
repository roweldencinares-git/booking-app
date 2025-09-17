import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the booking type belongs to the user
    const { data: bookingType, error: typeError } = await supabase
      .from('booking_types')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (typeError || !bookingType) {
      return NextResponse.json({ error: 'Service type not found' }, { status: 404 })
    }

    // Get all bookings for this service type
    const { data: allBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, start_time, status')
      .eq('booking_type_id', params.id)

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json({ error: 'Error checking bookings' }, { status: 500 })
    }

    const now = new Date()
    const totalBookings = allBookings?.length || 0
    const activeBookings = allBookings?.filter(booking =>
      booking.status !== 'cancelled'
    ).length || 0
    const upcomingBookings = allBookings?.filter(booking =>
      new Date(booking.start_time) > now && booking.status === 'confirmed'
    ).length || 0

    return NextResponse.json({
      totalBookings,
      activeBookings,
      upcomingBookings
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}