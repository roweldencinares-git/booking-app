export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                BookingApp collects minimal information necessary to provide our scheduling services:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Google Calendar access to manage appointments</li>
                <li>Basic profile information (name, email) for account creation</li>
                <li>Booking and appointment data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>To schedule and manage appointments</li>
                <li>To sync with your Google Calendar</li>
                <li>To send appointment reminders and notifications</li>
                <li>To provide customer support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Google Calendar Integration</h2>
              <p className="text-gray-700 mb-4">
                Our Google Calendar integration allows us to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Read your calendar to check availability</li>
                <li>Create calendar events for confirmed bookings</li>
                <li>Update or cancel events when bookings change</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You can revoke calendar access at any time through your Google account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700">
                We implement appropriate security measures to protect your personal information
                and calendar data. All data transmission is encrypted using industry-standard protocols.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this Privacy Policy, please contact us at:
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