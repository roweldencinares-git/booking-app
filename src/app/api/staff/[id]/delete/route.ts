import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

export async function DELETE(
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

    const staffId = params.id

    // Get the staff member to verify it exists
    const { data: staff, error: staffError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, clerk_user_id')
      .eq('id', staffId)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Check if this staff member has any future bookings
    const { data: futureBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, title, start_time')
      .eq('user_id', staffId)
      .gte('start_time', new Date().toISOString())
      .limit(5)

    if (bookingsError) {
      console.error('Error checking future bookings:', bookingsError)
      return NextResponse.json({ error: 'Failed to check future bookings' }, { status: 500 })
    }

    // Get delete options from request body
    const body = await request.json()
    const {
      deleteFutureBookings = false,
      transferBookingsTo = null,
      force = false
    } = body

    // If there are future bookings and no action specified, return warning
    if (futureBookings && futureBookings.length > 0 && !deleteFutureBookings && !transferBookingsTo && !force) {
      return NextResponse.json({
        warning: 'Staff member has future bookings',
        futureBookings,
        staffName: `${staff.first_name} ${staff.last_name}`,
        bookingCount: futureBookings.length
      }, { status: 409 }) // Conflict status
    }

    // Start transaction-like operations
    try {
      // 1. Handle future bookings based on user choice
      if (futureBookings && futureBookings.length > 0) {
        if (deleteFutureBookings) {
          // Delete all future bookings
          const { error: deleteBookingsError } = await supabase
            .from('bookings')
            .delete()
            .eq('user_id', staffId)
            .gte('start_time', new Date().toISOString())

          if (deleteBookingsError) throw deleteBookingsError
        } else if (transferBookingsTo) {
          // Transfer bookings to another staff member
          const { error: transferError } = await supabase
            .from('bookings')
            .update({ user_id: transferBookingsTo })
            .eq('user_id', staffId)
            .gte('start_time', new Date().toISOString())

          if (transferError) throw transferError
        }
      }

      // 2. Delete past bookings (always safe to delete)
      const { error: pastBookingsError } = await supabase
        .from('bookings')
        .delete()
        .eq('user_id', staffId)
        .lt('start_time', new Date().toISOString())

      if (pastBookingsError) console.warn('Error deleting past bookings:', pastBookingsError)

      // 3. Delete booking types
      const { error: bookingTypesError } = await supabase
        .from('booking_types')
        .delete()
        .eq('user_id', staffId)

      if (bookingTypesError) console.warn('Error deleting booking types:', bookingTypesError)

      // 4. Delete staff schedules
      const { error: schedulesError } = await supabase
        .from('staff_schedules')
        .delete()
        .eq('user_id', staffId)

      if (schedulesError) console.warn('Error deleting schedules:', schedulesError)

      // 5. Delete staff availability
      const { error: availabilityError } = await supabase
        .from('staff_availability')
        .delete()
        .eq('user_id', staffId)

      if (availabilityError) console.warn('Error deleting availability:', availabilityError)

      // 6. Finally, delete the staff member (mark as deleted instead of hard delete)
      const { error: deleteStaffError } = await supabase
        .from('users')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          email: `deleted_${Date.now()}_${staff.email}` // Prevent email conflicts
        })
        .eq('id', staffId)

      if (deleteStaffError) throw deleteStaffError

      return NextResponse.json({
        success: true,
        message: `Staff member ${staff.first_name} ${staff.last_name} has been deleted successfully`,
        deletedStaff: {
          id: staff.id,
          name: `${staff.first_name} ${staff.last_name}`,
          email: staff.email
        }
      })

    } catch (deleteError) {
      console.error('Error during deletion process:', deleteError)
      return NextResponse.json({
        error: 'Failed to delete staff member',
        details: deleteError
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Delete staff error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}