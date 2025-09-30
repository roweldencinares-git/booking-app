import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define admin routes that need special protection
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

// Define protected routes (regular user routes)
const isProtectedRoute = createRouteMatcher([
  '/bookings(.*)',
  '/settings(.*)',
  '/api/bookings(.*)',
  '/api/availability(.*)'
])

// Admin email addresses - only these can access admin panel
const ADMIN_EMAILS = [
  'roweld.encinares@spearity.com',
  // Add more admin emails here if needed
]

export default clerkMiddleware(async (auth, req) => {
  // TEMPORARILY DISABLE ALL ADMIN RESTRICTIONS FOR DEBUGGING
  if (isAdminRoute(req)) {
    const { userId } = await auth()

    // Only require sign-in, no email restrictions
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    // Allow any authenticated user for now
    console.log('Admin access granted (debug mode)')
  }

  // Regular protected routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}