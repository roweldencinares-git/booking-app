import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/bookings(.*)',
  '/settings(.*)',
  '/api/bookings(.*)',
  '/api/availability(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // Skip protection for handshake URLs
  if (req.nextUrl.searchParams.has('__clerk_handshake')) {
    return NextResponse.next()
  }

  // Only protect specific routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Exclude handshake URLs completely from middleware
    '/((?!.*__clerk_handshake|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css)$).*)',
  ],
}