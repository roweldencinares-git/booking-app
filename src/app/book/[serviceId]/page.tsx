import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import BookingForm from '../../../components/BookingForm'

interface ServiceBookingPageProps {
  params: {
    serviceId: string
  }
}

export default async function ServiceBookingPage({ params }: ServiceBookingPageProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get the specific service
  const { data: service, error } = await supabase
    .from('booking_types')
    .select(`
      *,
      users!inner(
        id,
        first_name,
        last_name,
        email,
        timezone,
        working_hours
      )
    `)
    .eq('id', params.serviceId)
    .eq('is_active', true)
    .single()

  if (error || !service) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <a
              href="/book"
              className="text-gray-400 hover:text-gray-600"
            >
              ← Back to Services
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Book: {service.name}
          </h1>
          <p className="mt-2 text-gray-600">
            Schedule your appointment with {service.users.first_name} {service.users.last_name}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Details */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Service Details
              </h2>

              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-gray-500 w-20">Duration:</span>
                  <span className="font-medium">
                    {service.duration_minutes || service.duration || 30} minutes
                  </span>
                </div>

                {service.price && (
                  <div className="flex items-center">
                    <span className="text-gray-500 w-20">Price:</span>
                    <span className="font-medium text-green-600">
                      ${service.price}
                    </span>
                  </div>
                )}

                <div className="flex items-center">
                  <span className="text-gray-500 w-20">Coach:</span>
                  <span className="font-medium">
                    {service.users.first_name} {service.users.last_name}
                  </span>
                </div>
              </div>

              {service.description && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-gray-600">
                    {service.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Select Date & Time
              </h2>

              <BookingForm
                service={service}
                coach={service.users}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}