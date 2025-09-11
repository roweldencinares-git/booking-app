import { type Booking, type UserIntegration } from './supabase'

// Zoho CRM types
export interface ZohoContact {
  id?: string
  Email: string
  First_Name?: string
  Last_Name?: string
  Full_Name?: string
  Phone?: string
  Lead_Source?: string
  Created_Time?: string
  Modified_Time?: string
}

export interface ZohoDeal {
  id?: string
  Deal_Name: string
  Contact_Name?: {
    id: string
    name: string
  }
  Account_Name?: {
    id: string
    name: string
  }
  Amount?: number
  Stage: string
  Closing_Date?: string
  Description?: string
  Booking_ID?: string
  Booking_Start_Time?: string
  Booking_End_Time?: string
  Booking_Status?: string
  Created_Time?: string
  Modified_Time?: string
}

export interface ZohoAuthResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

export interface CrmResult {
  success: boolean
  contactId?: string
  dealId?: string
  error?: string
}

export class CrmService {
  private accessToken: string
  private refreshToken?: string
  private baseUrl = 'https://www.zohoapis.com/crm/v2'

  constructor(integration: UserIntegration) {
    if (integration.provider !== 'zoho') {
      throw new Error('Invalid integration provider for CRM service')
    }
    this.accessToken = integration.access_token
    this.refreshToken = integration.refresh_token
  }

  /**
   * Upsert contact by email - creates new contact or updates existing
   */
  async upsertContact(client: {
    email: string
    name: string
    phone?: string
  }): Promise<CrmResult> {
    try {
      // First, search for existing contact by email
      const existingContact = await this.searchContactByEmail(client.email)
      
      if (existingContact) {
        // Update existing contact
        const updateResult = await this.updateContact(existingContact.id!, {
          Email: client.email,
          Full_Name: client.name,
          Phone: client.phone,
          Lead_Source: 'Booking System'
        })
        
        return {
          success: true,
          contactId: existingContact.id,
          ...updateResult
        }
      } else {
        // Create new contact
        const [firstName, ...lastNameParts] = client.name.split(' ')
        const lastName = lastNameParts.join(' ')
        
        const createResult = await this.createContact({
          Email: client.email,
          First_Name: firstName,
          Last_Name: lastName || '',
          Full_Name: client.name,
          Phone: client.phone,
          Lead_Source: 'Booking System'
        })
        
        return createResult
      }
    } catch (error) {
      console.error('Error upserting contact:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a new booking deal in Zoho CRM
   */
  async createZohoBooking(booking: Booking, contactId?: string): Promise<CrmResult> {
    try {
      // If no contactId provided, try to find or create contact first
      let finalContactId = contactId
      if (!finalContactId) {
        const contactResult = await this.upsertContact({
          email: booking.client_email,
          name: booking.client_name,
          phone: booking.client_phone
        })
        
        if (!contactResult.success || !contactResult.contactId) {
          return {
            success: false,
            error: 'Failed to create or find contact'
          }
        }
        finalContactId = contactResult.contactId
      }

      // Create deal for the booking
      const dealData: ZohoDeal = {
        Deal_Name: `Booking - ${booking.client_name} - ${new Date(booking.start_time).toLocaleDateString()}`,
        Contact_Name: {
          id: finalContactId,
          name: booking.client_name
        },
        Stage: this.mapBookingStatusToStage(booking.status),
        Closing_Date: booking.start_time.split('T')[0], // Date part only
        Description: `Booking Details:\nClient: ${booking.client_name}\nEmail: ${booking.client_email}\nPhone: ${booking.client_phone || 'N/A'}\nStart: ${booking.start_time}\nEnd: ${booking.end_time}\nNotes: ${booking.notes || 'N/A'}`,
        Booking_ID: booking.id,
        Booking_Start_Time: booking.start_time,
        Booking_End_Time: booking.end_time,
        Booking_Status: booking.status
      }

      const response = await this.makeZohoRequest('POST', '/deals', {
        data: [dealData]
      })

      if (response.data && response.data.length > 0) {
        const createdDeal = response.data[0]
        if (createdDeal.code === 'SUCCESS') {
          return {
            success: true,
            contactId: finalContactId,
            dealId: createdDeal.details.id
          }
        }
      }

      return {
        success: false,
        error: 'Failed to create deal in Zoho'
      }
    } catch (error) {
      console.error('Error creating Zoho booking:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update existing booking deal in Zoho CRM
   */
  async updateZohoBooking(booking: Booking, dealId?: string): Promise<CrmResult> {
    try {
      // If no dealId provided, try to find deal by booking ID
      let finalDealId = dealId
      if (!finalDealId) {
        const deal = await this.searchDealByBookingId(booking.id)
        if (!deal) {
          return {
            success: false,
            error: 'Deal not found for booking'
          }
        }
        finalDealId = deal.id
      }

      // Update deal data
      const updateData: Partial<ZohoDeal> = {
        Deal_Name: `Booking - ${booking.client_name} - ${new Date(booking.start_time).toLocaleDateString()}`,
        Stage: this.mapBookingStatusToStage(booking.status),
        Closing_Date: booking.start_time.split('T')[0],
        Description: `Booking Details:\nClient: ${booking.client_name}\nEmail: ${booking.client_email}\nPhone: ${booking.client_phone || 'N/A'}\nStart: ${booking.start_time}\nEnd: ${booking.end_time}\nNotes: ${booking.notes || 'N/A'}`,
        Booking_Start_Time: booking.start_time,
        Booking_End_Time: booking.end_time,
        Booking_Status: booking.status
      }

      const response = await this.makeZohoRequest('PUT', `/deals/${finalDealId}`, {
        data: [updateData]
      })

      if (response.data && response.data.length > 0) {
        const updatedDeal = response.data[0]
        if (updatedDeal.code === 'SUCCESS') {
          return {
            success: true,
            dealId: finalDealId
          }
        }
      }

      return {
        success: false,
        error: 'Failed to update deal in Zoho'
      }
    } catch (error) {
      console.error('Error updating Zoho booking:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Cancel booking deal in Zoho CRM (mark as lost/cancelled)
   */
  async cancelZohoBooking(booking: Booking, dealId?: string): Promise<CrmResult> {
    try {
      // If no dealId provided, try to find deal by booking ID
      let finalDealId = dealId
      if (!finalDealId) {
        const deal = await this.searchDealByBookingId(booking.id)
        if (!deal) {
          return {
            success: false,
            error: 'Deal not found for booking'
          }
        }
        finalDealId = deal.id
      }

      // Update deal to cancelled stage
      const updateData: Partial<ZohoDeal> = {
        Stage: 'Closed Lost',
        Booking_Status: 'cancelled',
        Description: `CANCELLED - Booking Details:\nClient: ${booking.client_name}\nEmail: ${booking.client_email}\nPhone: ${booking.client_phone || 'N/A'}\nOriginal Start: ${booking.start_time}\nOriginal End: ${booking.end_time}\nNotes: ${booking.notes || 'N/A'}\n\nCancellation Date: ${new Date().toISOString()}`
      }

      const response = await this.makeZohoRequest('PUT', `/deals/${finalDealId}`, {
        data: [updateData]
      })

      if (response.data && response.data.length > 0) {
        const updatedDeal = response.data[0]
        if (updatedDeal.code === 'SUCCESS') {
          return {
            success: true,
            dealId: finalDealId
          }
        }
      }

      return {
        success: false,
        error: 'Failed to cancel deal in Zoho'
      }
    } catch (error) {
      console.error('Error cancelling Zoho booking:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Private helper methods

  private async searchContactByEmail(email: string): Promise<ZohoContact | null> {
    try {
      const response = await this.makeZohoRequest('GET', '/contacts/search', {
        criteria: `(Email:equals:${email})`
      })

      if (response.data && response.data.length > 0) {
        return response.data[0]
      }
      return null
    } catch (error) {
      console.error('Error searching contact by email:', error)
      return null
    }
  }

  private async createContact(contactData: ZohoContact): Promise<CrmResult> {
    try {
      const response = await this.makeZohoRequest('POST', '/contacts', {
        data: [contactData]
      })

      if (response.data && response.data.length > 0) {
        const createdContact = response.data[0]
        if (createdContact.code === 'SUCCESS') {
          return {
            success: true,
            contactId: createdContact.details.id
          }
        }
      }

      return {
        success: false,
        error: 'Failed to create contact in Zoho'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async updateContact(contactId: string, updateData: Partial<ZohoContact>): Promise<Partial<CrmResult>> {
    try {
      const response = await this.makeZohoRequest('PUT', `/contacts/${contactId}`, {
        data: [updateData]
      })

      if (response.data && response.data.length > 0) {
        const updatedContact = response.data[0]
        if (updatedContact.code === 'SUCCESS') {
          return { success: true }
        }
      }

      return {
        success: false,
        error: 'Failed to update contact in Zoho'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async searchDealByBookingId(bookingId: string): Promise<ZohoDeal | null> {
    try {
      const response = await this.makeZohoRequest('GET', '/deals/search', {
        criteria: `(Booking_ID:equals:${bookingId})`
      })

      if (response.data && response.data.length > 0) {
        return response.data[0]
      }
      return null
    } catch (error) {
      console.error('Error searching deal by booking ID:', error)
      return null
    }
  }

  private mapBookingStatusToStage(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Closed Won'
      case 'completed':
        return 'Closed Won'
      case 'cancelled':
        return 'Closed Lost'
      default:
        return 'Qualification'
    }
  }

  private async makeZohoRequest(method: string, endpoint: string, params?: any): Promise<any> {
    const url = new URL(endpoint, this.baseUrl)
    
    // Add query parameters for GET requests
    if (method === 'GET' && params) {
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key])
      })
    }

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    }

    // Add body for POST/PUT requests
    if ((method === 'POST' || method === 'PUT') && params) {
      requestOptions.body = JSON.stringify(params)
    }

    const response = await fetch(url.toString(), requestOptions)

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        if (this.refreshToken) {
          await this.refreshAccessToken()
          // Retry the request with new token
          requestOptions.headers = {
            'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
          const retryResponse = await fetch(url.toString(), requestOptions)
          if (!retryResponse.ok) {
            throw new Error(`Zoho API error: ${retryResponse.status} ${retryResponse.statusText}`)
          }
          return await retryResponse.json()
        }
        throw new Error('Zoho API authentication failed')
      }
      throw new Error(`Zoho API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        refresh_token: this.refreshToken,
        client_id: process.env.ZOHO_CLIENT_ID!,
        client_secret: process.env.ZOHO_CLIENT_SECRET!,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to refresh Zoho access token')
    }

    const data: ZohoAuthResponse = await response.json()
    this.accessToken = data.access_token
    
    // TODO: Update the token in database
    // This would require updating the UserIntegration record
  }
}

// Utility function to create CRM service instance
export async function createCrmService(integration: UserIntegration): Promise<CrmService> {
  if (integration.provider !== 'zoho') {
    throw new Error('Invalid integration provider for CRM service')
  }
  
  return new CrmService(integration)
}