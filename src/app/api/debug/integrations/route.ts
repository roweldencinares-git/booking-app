import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all user integrations
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select('*')

    if (error) {
      console.error('Error fetching integrations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    return NextResponse.json({
      integrations: integrations || [],
      users: users || []
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    )
  }
}