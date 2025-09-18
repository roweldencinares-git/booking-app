import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import DateTimeScheduler from '../book/[serviceId]/schedule/DateTimeScheduler'

interface SlugPageProps {
  params: Promise<{ slug: string }>
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // First try to find service by slug column
  let { data: service } = await supabase
    .from('booking_types')
    .select(`
      *,
      users!inner(first_name, last_name, email, id)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  // If no slug column match, try to find by generating slug from name
  if (!service) {
    const { data: services } = await supabase
      .from('booking_types')
      .select(`
        *,
        users!inner(first_name, last_name, email, id)
      `)
      .eq('is_active', true)

    if (services) {
      // Find service where generated slug matches
      service = services.find(s => {
        const generatedSlug = s.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        return generatedSlug === slug
      })
    }
  }

  if (!service) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Book with {service.users.first_name} {service.users.last_name}
          </h1>
          <p className="mt-2 text-gray-600">
            {service.name}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Service Details Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              {/* Service Provider */}
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-bold">
                    {service.users.first_name[0]}{service.users.last_name[0]}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {service.users.first_name} {service.users.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">Service Provider</p>
                </div>
              </div>

              {/* Service Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {service.name}
                  </h2>
                  {service.description && (
                    <p className="text-gray-600 text-sm mb-4">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <span className="mr-3">⏱️</span>
                    <span>{service.duration} minutes</span>
                  </div>

                  {service.price && service.price > 0 && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-3">💰</span>
                      <span>${service.price}</span>
                    </div>
                  )}

                  {service.price === 0 && (
                    <div className="flex items-center text-green-600">
                      <span className="mr-3">🎁</span>
                      <span>Free</span>
                    </div>
                  )}

                  <div className="flex items-center text-gray-600">
                    <span className="mr-3">💻</span>
                    <span>Web conferencing details provided upon confirmation</span>
                  </div>
                </div>

                {/* Quick URL Reference */}
                <div className="mt-6 pt-6 border-t">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Booking URL:</span>
                    <div className="mt-1 font-mono bg-gray-100 p-2 rounded text-gray-700">
                      meetings.spearity.com/{slug}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="lg:col-span-2">
            <DateTimeScheduler
              serviceId={service.id}
              service={service}
            />
          </div>
        </div>
      </div>
    </div>
  )
}