import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
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
      console.error('User lookup error:', userError, 'for userId:', userId)
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Update booking type (only if it belongs to the user)
    const { data: bookingType, error } = await supabase
      .from('booking_types')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!bookingType) {
      return NextResponse.json({ error: 'Booking type not found' }, { status: 404 })
    }

    return NextResponse.json({ bookingType })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      console.error('User lookup error:', userError, 'for userId:', userId)
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // First, check if the booking type exists and belongs to the user
    const { data: bookingType, error: fetchError } = await supabase
      .from('booking_types')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !bookingType) {
      return NextResponse.json({ error: 'Service type not found or unauthorized' }, { status: 404 })
    }

    // Check for existing bookings that will be affected
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, client_name, start_time, status')
      .eq('booking_type_id', id)
      .in('status', ['confirmed', 'completed'])

    if (bookingsError) {
      console.error('Error checking existing bookings:', bookingsError)
      return NextResponse.json({ error: 'Error checking existing bookings' }, { status: 500 })
    }

    // Count upcoming bookings (not cancelled)
    const upcomingBookings = existingBookings?.filter(booking =>
      new Date(booking.start_time) > new Date() && booking.status === 'confirmed'
    ) || []

    // Delete booking type (CASCADE will automatically delete related bookings)
    const { data, error } = await supabase
      .from('booking_types')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Service type not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      deleted: data[0],
      deletedBookingsCount: existingBookings?.length || 0,
      upcomingBookingsCount: upcomingBookings.length,
      message: existingBookings?.length > 0
        ? `Service "${bookingType.name}" deleted successfully. ${existingBookings.length} related booking(s) were also deleted.`
        : `Service "${bookingType.name}" deleted successfully.`
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}