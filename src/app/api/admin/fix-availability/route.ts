import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

async function fixAvailability(userId: string) {
  // Update availability: Monday-Friday should be available, Saturday-Sunday should not
  const updates = [
    { day: 0, available: false }, // Sunday
    { day: 1, available: true },  // Monday
    { day: 2, available: true },  // Tuesday
    { day: 3, available: true },  // Wednesday
    { day: 4, available: true },  // Thursday
    { day: 5, available: true },  // Friday
    { day: 6, available: false }, // Saturday
  ]

  const results = []

  for (const update of updates) {
    const { data, error } = await supabase
      .from('availability')
      .update({ is_available: update.available })
      .eq('user_id', userId)
      .eq('day_of_week', update.day)
      .select()

    if (error) {
      results.push({ day: update.day, error: error.message })
    } else {
      results.push({ day: update.day, success: true, updated: data })
    }
  }

  return {
    message: 'Availability updated to Monday-Friday (9 AM - 5 PM)',
    results
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || '3b012c9c-f5c7-4bd1-9cd8-ea9106aadd64'

    const result = await fixAvailability(userId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || '3b012c9c-f5c7-4bd1-9cd8-ea9106aadd64'

    const result = await fixAvailability(userId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
