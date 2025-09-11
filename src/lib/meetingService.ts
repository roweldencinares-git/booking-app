import { supabase, type Booking } from './supabase'

export interface ZoomMeetingResponse {
  id: number
  uuid: string
  host_id: string
  topic: string
  type: number
  start_time: string
  duration: number
  timezone: string
  join_url: string
  password?: string
}

export interface ZoomMeetingRequest {
  topic: string
  type: 2 // Scheduled meeting
  start_time: string
  duration: number
  timezone?: string
  password?: string
  settings: {
    host_video: boolean
    participant_video: boolean
    join_before_host: boolean
    mute_upon_entry: boolean
    waiting_room: boolean
    auto_recording: 'none' | 'local' | 'cloud'
  }
}

export interface MeetingResult {
  meetingId: string
  joinUrl: string
  password?: string
}

export class MeetingService {
  private zoomAccessToken: string

  constructor(zoomAccessToken: string) {
    this.zoomAccessToken = zoomAccessToken
  }

  async createZoomMeeting(booking: Booking): Promise<MeetingResult> {
    try {
      // Get booking type details for meeting title
      const { data: bookingType } = await supabase
        .from('booking_types')
        .select('name, duration')
        .eq('id', booking.booking_type_id)
        .single()

      const meetingRequest: ZoomMeetingRequest = {
        topic: `${bookingType?.name || 'Appointment'} - ${booking.client_name}`,
        type: 2,
        start_time: booking.start_time,
        duration: bookingType?.duration || 60,
        timezone: 'America/New_York',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: 'none'
        }
      }

      const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.zoomAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingRequest)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Zoom API error: ${error.message || response.statusText}`)
      }

      const meeting: ZoomMeetingResponse = await response.json()

      // Update booking with Zoom meeting details
      await supabase
        .from('bookings')
        .update({
          zoom_meeting_id: meeting.id.toString(),
          zoom_join_url: meeting.join_url,
          zoom_password: meeting.password
        })
        .eq('id', booking.id)

      return {
        meetingId: meeting.id.toString(),
        joinUrl: meeting.join_url,
        password: meeting.password
      }
    } catch (error) {
      console.error('Failed to create Zoom meeting:', error)
      throw new Error(`Failed to create Zoom meeting: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateZoomMeeting(booking: Booking): Promise<MeetingResult> {
    if (!booking.zoom_meeting_id) {
      throw new Error('No Zoom meeting ID found for this booking')
    }

    try {
      // Get booking type details for meeting title
      const { data: bookingType } = await supabase
        .from('booking_types')
        .select('name, duration')
        .eq('id', booking.booking_type_id)
        .single()

      const meetingRequest: Partial<ZoomMeetingRequest> = {
        topic: `${bookingType?.name || 'Appointment'} - ${booking.client_name}`,
        start_time: booking.start_time,
        duration: bookingType?.duration || 60,
        timezone: 'America/New_York'
      }

      const response = await fetch(`https://api.zoom.us/v2/meetings/${booking.zoom_meeting_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.zoomAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingRequest)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Zoom API error: ${error.message || response.statusText}`)
      }

      // Get updated meeting details
      const getResponse = await fetch(`https://api.zoom.us/v2/meetings/${booking.zoom_meeting_id}`, {
        headers: {
          'Authorization': `Bearer ${this.zoomAccessToken}`
        }
      })

      if (!getResponse.ok) {
        throw new Error('Failed to fetch updated meeting details')
      }

      const updatedMeeting: ZoomMeetingResponse = await getResponse.json()

      // Update booking with new meeting details
      await supabase
        .from('bookings')
        .update({
          zoom_join_url: updatedMeeting.join_url,
          zoom_password: updatedMeeting.password
        })
        .eq('id', booking.id)

      return {
        meetingId: updatedMeeting.id.toString(),
        joinUrl: updatedMeeting.join_url,
        password: updatedMeeting.password
      }
    } catch (error) {
      console.error('Failed to update Zoom meeting:', error)
      throw new Error(`Failed to update Zoom meeting: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteZoomMeeting(booking: Booking): Promise<boolean> {
    if (!booking.zoom_meeting_id) {
      console.warn('No Zoom meeting ID found for this booking')
      return true
    }

    try {
      const response = await fetch(`https://api.zoom.us/v2/meetings/${booking.zoom_meeting_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.zoomAccessToken}`
        }
      })

      if (!response.ok && response.status !== 404) {
        const error = await response.json()
        throw new Error(`Zoom API error: ${error.message || response.statusText}`)
      }

      // Clear Zoom meeting details from booking
      await supabase
        .from('bookings')
        .update({
          zoom_meeting_id: null,
          zoom_join_url: null,
          zoom_password: null
        })
        .eq('id', booking.id)

      return true
    } catch (error) {
      console.error('Failed to delete Zoom meeting:', error)
      throw new Error(`Failed to delete Zoom meeting: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getMeetingDetails(meetingId: string): Promise<ZoomMeetingResponse> {
    try {
      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${this.zoomAccessToken}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Zoom API error: ${error.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get meeting details:', error)
      throw new Error(`Failed to get meeting details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export async function createMeetingService(userId: string): Promise<MeetingService> {
  // Get Zoom access token from Supabase
  const { data: zoomToken, error } = await supabase
    .from('user_integrations')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider', 'zoom')
    .eq('is_active', true)
    .single()

  if (error || !zoomToken?.access_token) {
    throw new Error('Zoom integration not found or inactive. Please connect your Zoom account.')
  }

  return new MeetingService(zoomToken.access_token)
}