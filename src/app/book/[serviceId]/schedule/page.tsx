import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DateTimeScheduler from './DateTimeScheduler'

interface SchedulePageProps {
  params: Promise<{ serviceId: string }>
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const { serviceId } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get service details
  const { data: service } = await supabase
    .from('booking_types')
    .select(`
      *,
      users!inner(first_name, last_name, email, id)
    `)
    .eq('id', serviceId)
    .eq('is_active', true)
    .single()

  if (!service) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link
              href="/book"
              className="mr-4 p-2 hover:bg-gray-100 rounded-md"
            >
              ←
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Select a Date & Time
            </h1>
          </div>
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

                  {service.price && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-3">💰</span>
                      <span>${service.price}</span>
                    </div>
                  )}

                  <div className="flex items-center text-gray-600">
                    <span className="mr-3">💻</span>
                    <span>Web conferencing details provided upon confirmation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="lg:col-span-2">
            <DateTimeScheduler
              serviceId={serviceId}
              service={service}
            />
          </div>
        </div>
      </div>
    </div>
  )
}