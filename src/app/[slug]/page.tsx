import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PersonalizedBooking from './PersonalizedBooking'

interface SlugPageProps {
  params: Promise<{ slug: string }>
}

// Helper function to generate URL-safe slug from service name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params

  // Decode URL-encoded characters (e.g., %20 becomes space)
  const decodedSlug = decodeURIComponent(slug)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get all active services and find one with matching slug
  const { data: services } = await supabase
    .from('booking_types')
    .select(`
      *,
      users!inner(first_name, last_name, email, id)
    `)
    .eq('is_active', true)

  // Try multiple matching strategies:
  // 1. Match generated slug (e.g., "rowel-1")
  // 2. Match decoded slug that might have spaces (e.g., "rowel 1")
  let service = services?.find(s =>
    generateSlug(s.name) === slug ||
    generateSlug(s.name) === decodedSlug ||
    s.name.toLowerCase() === decodedSlug.toLowerCase()
  )

  // If no match, try exact name match for backwards compatibility
  if (!service) {
    // Try with decoded slug first
    const { data: exactMatch } = await supabase
      .from('booking_types')
      .select(`
        *,
        users!inner(first_name, last_name, email, id)
      `)
      .eq('name', decodedSlug)
      .eq('is_active', true)
      .single()

    service = exactMatch || null

    // If still no match, try with original slug
    if (!service) {
      const { data: originalMatch } = await supabase
        .from('booking_types')
        .select(`
          *,
          users!inner(first_name, last_name, email, id)
        `)
        .eq('name', slug)
        .eq('is_active', true)
        .single()

      service = originalMatch || null
    }
  }

  // If still no match, try legacy mappings for backwards compatibility
  if (!service) {
    const legacyMappings: Record<string, string> = {
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