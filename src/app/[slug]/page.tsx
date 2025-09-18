import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PersonalizedBooking from './PersonalizedBooking'

interface SlugPageProps {
  params: Promise<{ slug: string }>
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // First try to find service by exact slug match
  let { data: service } = await supabase
    .from('booking_types')
    .select(`
      *,
      users!inner(first_name, last_name, email, id)
    `)
    .eq('name', slug)
    .eq('is_active', true)
    .single()

  // If no exact match, try legacy mappings for backwards compatibility
  if (!service) {
    const legacyMappings = {
      'darren30': 'rowel30', // Legacy mapping
      'coaching60': '1 Hour Coaching Session',
      'consultation30': '30 Minute Consultation',
      'discovery15': 'Free Discovery Call'
    }

    const mappedServiceName = legacyMappings[slug]
    if (mappedServiceName) {
      const { data: mappedService } = await supabase
        .from('booking_types')
        .select(`
          *,
          users!inner(first_name, last_name, email, id)
        `)
        .eq('name', mappedServiceName)
        .eq('is_active', true)
        .single()

      service = mappedService
    }
  }

  if (!service) {
    notFound()
  }

  return (
    <PersonalizedBooking
      service={service}
      slug={slug}
    />
  )
}