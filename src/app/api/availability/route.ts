import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { user_id, timezone, weekly_hours, date_overrides } = body

    // Verify user_id matches authenticated user
    if (user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if availability settings already exist
    const { data: existingAvailability } = await supabase
      .from('user_availability')
      .select('id')
      .eq('user_id', user_id)
      .single()

    const availabilityData = {
      user_id,
      timezone,
      weekly_hours,
      date_overrides,
      updated_at: new Date().toISOString()
    }

    if (existingAvailability) {
      // Update existing availability
      const { data, error } = await supabase
        .from('user_availability')
        .update(availabilityData)
        .eq('user_id', user_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating availability:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data, message: 'Availability updated successfully' })
    } else {
      // Create new availability
      const { data, error } = await supabase
        .from('user_availability')
        .insert({
          ...availabilityData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating availability:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data, message: 'Availability created successfully' })
    }
  } catch (error) {
    console.error('Error in availability API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch user's availability settings
    const { data: availability, error } = await supabase
      .from('user_availability')
      .select('*')
      .eq('user_id', dbUser.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching availability:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: availability })
  } catch (error) {
    console.error('Error in availability GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}