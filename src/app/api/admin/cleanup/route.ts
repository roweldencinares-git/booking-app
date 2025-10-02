import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
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
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { daysOld = 90 } = await request.json()

    // Calculate cutoff date (default: 90 days ago)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Delete old completed or cancelled bookings
    const { data: deletedBookings, error } = await supabase
      .from('bookings')
      .delete()
      .eq('user_id', user.id)
      .lt('end_time', cutoffDate.toISOString())
      .in('status', ['completed', 'cancelled'])
      .select()

    if (error) {
      console.error('Cleanup error:', error)
      return NextResponse.json(
        { error: 'Failed to cleanup bookings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedBookings?.length || 0,
      cutoffDate: cutoffDate.toISOString(),
      message: `Deleted ${deletedBookings?.length || 0} old bookings`
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup bookings' },
      { status: 500 }
    )
  }
}

// Get cleanup statistics (how many would be deleted)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const daysOld = parseInt(searchParams.get('daysOld') || '90')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Count old bookings
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lt('end_time', cutoffDate.toISOString())
      .in('status', ['completed', 'cancelled'])

    return NextResponse.json({
      count: count || 0,
      cutoffDate: cutoffDate.toISOString(),
      daysOld
    })

  } catch (error) {
    console.error('Cleanup stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get cleanup statistics' },
      { status: 500 }
    )
  }
}
