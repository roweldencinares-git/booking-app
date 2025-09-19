import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Update staff member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const updates = await request.json()

    // Validate allowed updates
    const allowedFields = ['first_name', 'last_name', 'email', 'timezone', 'role', 'status']
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update the staff member
    const { data, error } = await supabase
      .from('users')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      staff: data,
      message: 'Staff member updated successfully'
    })

  } catch (error) {
    console.error('Staff update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if staff member exists
    const { data: staff, error: staffError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', id)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Instead of hard delete, we'll deactivate the user
    // This preserves booking history and relationships
    const { error: updateError } = await supabase
      .from('users')
      .update({
        status: 'deleted',
        email: `deleted_${Date.now()}_${staff.email}` // Ensure unique constraint
      })
      .eq('id', id)

    if (updateError) {
      console.error('Delete error:', updateError)
      return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${staff.first_name} ${staff.last_name} has been removed from your team`
    })

  } catch (error) {
    console.error('Staff delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get staff member details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: staff, error } = await supabase
      .from('users')
      .select(`
        *,
        user_integrations (
          provider,
          is_active,
          created_at
        )
      `)
      .eq('id', id)
      .neq('status', 'deleted')
      .single()

    if (error || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Get recent booking activity
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id, start_time, client_name, status')
      .eq('user_id', id)
      .order('start_time', { ascending: false })
      .limit(5)

    return NextResponse.json({
      staff: {
        ...staff,
        recent_bookings: recentBookings || []
      }
    })

  } catch (error) {
    console.error('Staff fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}