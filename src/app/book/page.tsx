import { createClient } from '@supabase/supabase-js'
import ServiceSelector from '../../components/ServiceSelector'

export default async function PublicBookingPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all active services for public booking
  const { data: services } = await supabase
    .from('booking_types')
    .select(`
      *,
      users!inner(first_name, last_name, email)
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Book an Appointment
          </h1>
          <p className="mt-2 text-gray-600">
            Choose a service and schedule your appointment
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Available Services
          </h2>
          
          {services && services.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p>⏱️ {service.duration} minutes</p>
                    {service.price && <p>💰 ${service.price}</p>}
                    <p>👤 with {service.users.first_name} {service.users.last_name}</p>
                  </div>
                  
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {service.description}
                    </p>
                  )}
                  
                  <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
                    Select This Service
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 16L8 17h8l-4 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Services Available
              </h3>
              <p className="text-gray-500">
                Please check back later or contact us directly.
              </p>
            </div>
          )}
        </div>
        
        {/* Contact Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Need Help?
          </h3>
          <p className="text-blue-700">
            If you have questions or need to reschedule, please contact our team.
          </p>
          <div className="mt-4 flex space-x-4">
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              📧 Send Email
            </button>
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              📞 Call Us
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}