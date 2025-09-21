export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using BookingApp, you accept and agree to be bound by the terms
                and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Use of the Service</h2>
              <p className="text-gray-700 mb-4">
                BookingApp provides appointment scheduling and calendar management services. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Use the service for lawful purposes only</li>
                <li>Provide accurate booking and contact information</li>
                <li>Respect other users' time and scheduled appointments</li>
                <li>Not attempt to disrupt or interfere with the service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Google Calendar Integration</h2>
              <p className="text-gray-700 mb-4">
                By connecting your Google Calendar, you grant BookingApp permission to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Access your calendar to check availability</li>
                <li>Create, modify, and delete calendar events related to bookings</li>
                <li>Send calendar invitations to meeting participants</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You can revoke these permissions at any time through your Google account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Booking Policy</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Appointments must be cancelled at least 24 hours in advance when possible</li>
                <li>No-shows may result in restrictions on future bookings</li>
                <li>Service providers reserve the right to cancel or reschedule appointments</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700">
                BookingApp is provided "as is" without warranty of any kind. We are not liable
                for any damages arising from the use of this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700">
                For questions about these Terms of Service, please contact us at:
                <br />
                Email: support@meetings.spearity.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}