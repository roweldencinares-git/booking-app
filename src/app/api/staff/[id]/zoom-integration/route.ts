import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Zoom integration for this staff member
    const { data: integration, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', id)
      .eq('provider', 'zoom')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      integration: integration || null
    })

  } catch (error) {
    console.error('Error fetching Zoom integration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Deactivate Zoom integration for this staff member
    const { error } = await supabase
      .from('user_integrations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', id)
      .eq('provider', 'zoom')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to disconnect Zoom' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error disconnecting Zoom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}