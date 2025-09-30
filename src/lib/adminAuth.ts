import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

// Admin email addresses - only these can access admin APIs
const ADMIN_EMAILS = [
  'roweld.encinares@spearity.com',
  // Add more admin emails here if needed
]

/**
 * Verify if the current user is an admin
 * Used for API route protection
 */
export async function verifyAdmin() {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return { isAdmin: false, error: 'Not authenticated' }
    }

    const userEmail = sessionClaims?.email as string

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return { isAdmin: false, error: 'Not authorized' }
    }

    return { isAdmin: true, userId, userEmail }
  } catch (error) {
    return { isAdmin: false, error: 'Authentication failed' }
  }
}

/**
 * API middleware to protect admin-only endpoints
 */
export async function requireAdmin() {
  const result = await verifyAdmin()

  if (!result.isAdmin) {
    throw new Error(result.error || 'Admin access required')
  }

  return result
}

/**
 * Check if an email is in the admin list
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email)
}

/**
 * Get all admin emails (for management purposes)
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS]
}