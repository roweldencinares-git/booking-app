import { google } from 'googleapis'

const calendar = google.calendar('v3')

// Google Calendar OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
}

export class GoogleCalendarService {
  private userId: string

  constructor(
    private accessToken: string,
    private refreshToken: string,
    userId?: string,
    private expiryDate?: Date
  ) {
    this.userId = userId || ''
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate?.getTime()
    })
  }

  // Check if token is expired and refresh if needed
  private async ensureValidToken(): Promise<void> {
    try {
      const credentials = oauth2Client.credentials

      // If token expires within 5 minutes, refresh it
      if (credentials.expiry_date && credentials.expiry_date < Date.now() + (5 * 60 * 1000)) {
        console.log('Token expiring soon, refreshing...')
        await this.refreshAccessToken()
      }
    } catch (error) {
      console.error('Error checking token validity:', error)
      throw error
    }
  }

  // Refresh the access token using refresh token
  private async refreshAccessToken(): Promise<void> {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()

      if (credentials.access_token && this.userId) {
        // Update database with new token
        await this.updateTokenInDatabase(credentials.access_token, credentials.expiry_date)
      }

      oauth2Client.setCredentials(credentials)
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw new Error('Failed to refresh Google Calendar access token')
    }
  }

  // Update token in database
  private async updateTokenInDatabase(accessToken: string, expiryDate?: number | null): Promise<void> {
    if (!this.userId) return

    try {
      const response = await fetch('/api/auth/google/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          accessToken,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null
        })
      })

      if (!response.ok) {
        console.error('Failed to update token in database')
      }
    } catch (error) {
      console.error('Error updating token in database:', error)
    }
  }

  // Create a calendar event
  async createEvent(calendarId: string = 'primary', event: CalendarEvent) {
    try {
      await this.ensureValidToken()
      const response = await calendar.events.insert({
        auth: oauth2Client,
        calendarId,
        requestBody: event,
        sendUpdates: 'all' // Send invites to attendees
      })
      
      return response.data
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw error
    }
  }

  // Update an existing event
  async updateEvent(calendarId: string = 'primary', eventId: string, event: CalendarEvent) {
    try {
      await this.ensureValidToken()
      const response = await calendar.events.update({
        auth: oauth2Client,
        calendarId,
        eventId,
        requestBody: event,
        sendUpdates: 'all'
      })
      
      return response.data
    } catch (error) {
      console.error('Error updating calendar event:', error)
      throw error
    }
  }

  // Delete an event
  async deleteEvent(calendarId: string = 'primary', eventId: string) {
    try {
      await this.ensureValidToken()
      await calendar.events.delete({
        auth: oauth2Client,
        calendarId,
        eventId,
        sendUpdates: 'all'
      })
      
      return true
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      throw error
    }
  }

  // Get busy times (for conflict detection)
  async getBusyTimes(calendarId: string = 'primary', timeMin: string, timeMax: string) {
    try {
      await this.ensureValidToken()
      const response = await calendar.freebusy.query({
        auth: oauth2Client,
        requestBody: {
          timeMin,
          timeMax,
          items: [{ id: calendarId }]
        }
      })
      
      return response.data.calendars?.[calendarId]?.busy || []
    } catch (error) {
      console.error('Error getting busy times:', error)
      throw error
    }
  }

  // List upcoming events
  async listEvents(calendarId: string = 'primary', timeMin?: string, timeMax?: string, maxResults: number = 10) {
    try {
      await this.ensureValidToken()
      const response = await calendar.events.list({
        auth: oauth2Client,
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      })
      
      return response.data.items || []
    } catch (error) {
      console.error('Error listing calendar events:', error)
      throw error
    }
  }

  // Get user's calendar list
  async getCalendars() {
    try {
      await this.ensureValidToken()
      const response = await calendar.calendarList.list({
        auth: oauth2Client
      })
      
      return response.data.items || []
    } catch (error) {
      console.error('Error getting calendar list:', error)
      throw error
    }
  }
}

// Helper function to generate Google OAuth URL
export function getGoogleAuthUrl(userId: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request offline access for refresh tokens
    scope: scopes,
    state: userId, // Pass user ID to link account
    prompt: 'consent', // Force consent screen to get refresh token
    include_granted_scopes: true // Include previously granted scopes
  })
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  try {
    const { tokens } = await oauth2Client.getAccessToken(code)
    return tokens
  } catch (error) {
    console.error('Error exchanging code for tokens:', error)
    throw error
  }
}