import Link from 'next/link';

export default function ZoomGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Zoom Integration Guide
              </h1>
              <p className="text-lg text-gray-600">
                Complete instructions for adding, using, and removing Zoom integration
              </p>
            </div>

            <div className="space-y-8">
              {/* Adding the App */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  🔧 Adding Zoom Integration
                </h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Prerequisites</h3>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Admin access to the booking system</li>
                      <li>• Zoom Pro, Business, or Enterprise account</li>
                      <li>• Zoom Marketplace developer access</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800">Step 1: Create Zoom OAuth App</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                    <li>Go to <a href="https://marketplace.zoom.us/" className="text-blue-600 hover:underline" target="_blank">Zoom Marketplace</a></li>
                    <li>Click "Develop" → "Build App"</li>
                    <li>Select "OAuth" app type</li>
                    <li>Fill in app details:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li><strong>App Name:</strong> Your Booking System</li>
                        <li><strong>Choose app type:</strong> User-managed app</li>
                        <li><strong>Redirect URL:</strong> <code className="bg-gray-100 px-1 rounded">https://your-domain.vercel.app/api/auth/zoom</code></li>
                      </ul>
                    </li>
                    <li>Set required scopes:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li><code className="bg-gray-100 px-1 rounded">meeting:write</code></li>
                        <li><code className="bg-gray-100 px-1 rounded">meeting:read</code></li>
                        <li><code className="bg-gray-100 px-1 rounded">user:read</code></li>
                      </ul>
                    </li>
                    <li>Copy your Client ID and Client Secret</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-gray-800">Step 2: Configure Environment</h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Add to your .env.local file:</p>
                    <pre className="text-sm text-gray-800 overflow-x-auto">
{`ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_REDIRECT_URI=https://your-domain.vercel.app/api/auth/zoom`}
                    </pre>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800">Step 3: Connect Your Account</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                    <li>Navigate to Admin → Settings in your booking system</li>
                    <li>Find the "Zoom Integration" section</li>
                    <li>Click "Connect Zoom Account"</li>
                    <li>Authorize the app in the popup window</li>
                    <li>Verify connection shows "Connected" status</li>
                  </ol>
                </div>
              </section>

              {/* Using the App */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  🚀 Using Zoom Integration
                </h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Automatic Meeting Creation</h3>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <p className="text-green-700">
                      Once connected, Zoom meetings are automatically created for all new bookings.
                      No additional action required!
                    </p>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800">What Happens When Someone Books:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                    <li>Booking is created in the system</li>
                    <li>Zoom meeting is automatically generated</li>
                    <li>Meeting details are saved to the booking</li>
                    <li>Confirmation email includes Zoom link</li>
                    <li>Calendar invite contains meeting info</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-gray-800">Meeting Details Include:</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Unique meeting ID</li>
                    <li>Join URL for participants</li>
                    <li>Host start URL (for staff)</li>
                    <li>Passcode (if enabled)</li>
                    <li>Dial-in numbers</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-800">Managing Meetings</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">For Staff:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• View all meeting links in the booking dashboard</li>
                      <li>• Use "Start Host Meeting" links to begin sessions</li>
                      <li>• Access waiting room controls</li>
                      <li>• Download meeting recordings (if enabled)</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">For Clients:</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Receive meeting links via email confirmation</li>
                      <li>• Find links in calendar invitations</li>
                      <li>• Join from browser or Zoom app</li>
                      <li>• No Zoom account required to join</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Removing the App */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  🗑️ Removing Zoom Integration
                </h2>
                <div className="space-y-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notice</h3>
                    <p className="text-yellow-700">
                      Removing integration will affect existing bookings with Zoom meetings.
                      Consider the impact before proceeding.
                    </p>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800">Step 1: Disconnect from Booking System</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                    <li>Go to Admin → Settings</li>
                    <li>Find "Zoom Integration" section</li>
                    <li>Click "Disconnect Zoom Account"</li>
                    <li>Confirm disconnection in the dialog</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-gray-800">Step 2: Revoke App Access (Optional)</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                    <li>Log into your Zoom account</li>
                    <li>Go to Account Management → Account Settings</li>
                    <li>Click "Apps" in the left sidebar</li>
                    <li>Find your booking app and click "Revoke"</li>
                  </ol>

                  <h3 className="text-lg font-semibold text-gray-800">Step 3: Clean Up Environment</h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Remove from .env.local:</p>
                    <pre className="text-sm text-gray-800">
{`# Remove these lines
# ZOOM_CLIENT_ID=...
# ZOOM_CLIENT_SECRET=...
# ZOOM_REDIRECT_URI=...`}
                    </pre>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800">What Happens After Removal:</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>New bookings will not create Zoom meetings</li>
                    <li>Existing meetings remain accessible via saved links</li>
                    <li>Past recordings are preserved in Zoom account</li>
                    <li>System continues to function without video meetings</li>
                  </ul>
                </div>
              </section>

              {/* Troubleshooting */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  🔧 Troubleshooting
                </h2>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-800">Error: "Invalid client_id"</h4>
                      <p className="text-red-700 mt-1">
                        Check that ZOOM_CLIENT_ID matches your app's Client ID exactly.
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-800">Error: "Redirect URI mismatch"</h4>
                      <p className="text-red-700 mt-1">
                        Verify the redirect URI in your Zoom app matches ZOOM_REDIRECT_URI exactly.
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-800">Meetings not creating</h4>
                      <p className="text-red-700 mt-1">
                        Ensure your Zoom account has meeting creation permissions and hasn't exceeded limits.
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-800">Connection keeps dropping</h4>
                      <p className="text-red-700 mt-1">
                        Check if your Zoom app needs approval from your organization's admin.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Support */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  📞 Support
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 mb-4">
                    Need additional help? Contact our support team or check these resources:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <a href="https://developers.zoom.us/docs/" className="text-blue-600 hover:underline" target="_blank">Zoom Developer Documentation</a></li>
                    <li>• <a href="https://support.zoom.us/" className="text-blue-600 hover:underline" target="_blank">Zoom Support Center</a></li>
                    <li>• Email: info@spearity.com</li>
                  </ul>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <Link href="/" className="text-blue-600 hover:underline">
                ← Back to Booking System
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}