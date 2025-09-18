import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClientDetailsForm from './ClientDetailsForm'

interface DetailsPageProps {
  params: Promise<{ serviceId: string }>
  searchParams: Promise<{ date?: string; time?: string; duration?: string }>
}

export default async function DetailsPage({ params, searchParams }: DetailsPageProps) {
  const { serviceId } = await params
  const { date, time, duration } = await searchParams
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get service details
  const { data: service } = await supabase
    .from('booking_types')
    .select(`
      *,
      users!inner(first_name, last_name, email)
    `)
    .eq('id', serviceId)
    .eq('is_active', true)
    .single()

  if (!service || !date || !time || !duration) {
    notFound()
  }

  const selectedDate = new Date(date)
  const formatSelectedDateTime = () => {
    const dateStr = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    return `${dateStr} at ${time}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link
              href={`/book/${serviceId}/schedule?date=${date}&time=${time}&duration=${duration}`}
              className="mr-4 p-2 hover:bg-gray-100 rounded-md"
            >
              ←
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Enter Your Details
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Booking Summary
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-600">
                    with {service.users.first_name} {service.users.last_name}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <span className="mr-3">📅</span>
                    <span>{formatSelectedDateTime()}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <span className="mr-3">⏱️</span>
                    <span>{duration} minutes</span>
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

          {/* Client Details Form */}
          <div className="lg:col-span-2">
            <ClientDetailsForm
              serviceId={serviceId}
              service={service}
              selectedDate={date}
              selectedTime={time}
              selectedDuration={parseInt(duration)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}