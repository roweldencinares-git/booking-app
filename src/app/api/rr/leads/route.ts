import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendLeadNotification } from '@/lib/rrEmailTemplates'

// Public endpoint — rank & rent sites POST leads here (no auth required)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) || await req.formData().catch(() => null)

  let data: Record<string, string> = {}
  if (body instanceof FormData) {
    body.forEach((v, k) => { data[k] = v.toString() })
  } else {
    data = body || {}
  }

  const { property_domain, name, phone, email, message, source } = data

  // Look up property by domain
  let propertyId: string | null = null
  if (property_domain) {
    const { data: prop } = await supabase
      .from('rr_properties')
      .select('id')
      .ilike('domain', property_domain)
      .single()
    propertyId = prop?.id || null
  }

  const { data: lead, error } = await supabase.from('rr_leads').insert({
    property_id: propertyId,
    name: name || null,
    phone: phone || null,
    email: email || null,
    message: message || null,
    source: source || 'organic',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Forward lead to renting client if property is rented
  if (propertyId) {
    const { data: rental } = await supabase
      .from('rr_rentals')
      .select('*, rr_clients(email, business_name, contact_name), rr_properties(domain, niche, location)')
      .eq('property_id', propertyId)
      .eq('status', 'active')
      .single()

    if (rental?.rr_clients?.email) {
      await sendLeadNotification(rental.rr_clients.email, {
        clientName: rental.rr_clients.contact_name || rental.rr_clients.business_name,
        leadName: name,
        leadPhone: phone,
        leadEmail: email,
        message,
        propertyDomain: rental.rr_properties.domain,
        propertyLocation: rental.rr_properties.location,
      }).catch(() => {})

      await supabase.from('rr_leads').update({ forwarded_at: new Date().toISOString() }).eq('id', lead.id)
    }
  }

  return NextResponse.json({ success: true, id: lead.id }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}

// Admin: list leads (authenticated)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const propertyId = searchParams.get('property_id')

  let query = supabase
    .from('rr_leads')
    .select('*, rr_properties(domain, location, niche)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (propertyId) query = query.eq('property_id', propertyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
