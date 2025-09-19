import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Update staff configuration
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
    const { section, updates } = await request.json()

    // Validate section
    const allowedSections = ['working_hours', 'booking_settings', 'notifications', 'permissions']
    if (!allowedSections.includes(section)) {
      return NextResponse.json({ error: 'Invalid configuration section' }, { status: 400 })
    }

    // Check if staff member exists
    const { data: staff, error: staffError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('id', id)
      .neq('status', 'deleted')
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Get existing configuration or create default
    let { data: existingConfig } = await supabase
      .from('staff_configurations')
      .select('*')
      .eq('user_id', id)
      .single()

    if (!existingConfig) {
      // Create default configuration
      const defaultConfig = {
        user_id: id,
        working_hours: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '09:00', end: '17:00' }
        },
        booking_settings: {
          booking_buffer: 15,
          advance_booking_days: 30,
          min_booking_notice: 60
        },
        notifications: {
          email_reminders: true,
          sms_reminders: false,
          booking_confirmations: true,
          schedule_changes: true
        },
        permissions: {
          can_view_all_bookings: false,
          can_edit_own_schedule: true,
          can_cancel_bookings: true,
          can_reschedule_bookings: true
        }
      }

      const { data: newConfig, error: createError } = await supabase
        .from('staff_configurations')
        .insert(defaultConfig)
        .select()
        .single()

      if (createError) {
        console.error('Error creating default config:', createError)
        return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 })
      }

      existingConfig = newConfig
    }

    // Update the specific section
    const updatedConfig = {
      ...existingConfig,
      [section]: updates
    }

    const { data, error } = await supabase
      .from('staff_configurations')
      .update({ [section]: updates })
      .eq('user_id', id)
      .select()
      .single()

    if (error) {
      console.error('Configuration update error:', error)
      return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      configuration: data,
      message: `${section.replace('_', ' ')} updated successfully`
    })

  } catch (error) {
    console.error('Staff configuration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get staff configuration
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

    const { data: config, error } = await supabase
      .from('staff_configurations')
      .select('*')
      .eq('user_id', id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Configuration fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
    }

    return NextResponse.json({
      configuration: config || null
    })

  } catch (error) {
    console.error('Staff configuration fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}