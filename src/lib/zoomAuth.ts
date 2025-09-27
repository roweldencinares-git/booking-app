// Zoom OAuth helper for user-authorized tokens
export class ZoomAuth {

  /**
   * Create a Zoom meeting using user's authorized token
   */
  static async createMeeting(
    accessToken: string,
    meetingData: {
      topic: string
      start_time: string
      duration: number
      timezone?: string
    }
  ): Promise<any> {
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: meetingData.topic,
        type: 2, // Scheduled meeting
        start_time: meetingData.start_time,
        duration: meetingData.duration,
        timezone: meetingData.timezone || 'UTC',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          audio: 'both'
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create Zoom meeting: ${error}`)
    }

    return await response.json()
  }

  /**
   * Get user's Zoom access token from database
   */
  static async getUserZoomToken(userId: string): Promise<string | null> {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data, error } = await supabase
        .from('user_integrations')
        .select('access_token, expires_at, refresh_token')
        .eq('user_id', userId)
        .eq('provider', 'zoom')
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return null
      }

      // Check if token is expired and refresh if needed
      const expiresAt = new Date(data.expires_at)
      if (expiresAt <= new Date()) {
        // Token expired, attempt refresh
        if (data.refresh_token) {
          const newToken = await this.refreshToken(data.refresh_token, userId)
          return newToken
        }
        return null
      }

      return data.access_token
    } catch (error) {
      console.error('Error getting user Zoom token:', error)
      return null
    }
  }

  /**
   * Refresh Zoom access token
   */
  static async refreshToken(refreshToken: string, userId: string): Promise<string | null> {
    try {
      const response = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
          ).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      })

      if (!response.ok) {
        return null
      }

      const tokenData = await response.json()

      // Update database with new token
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)

      await supabase
        .from('user_integrations')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || refreshToken,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', 'zoom')

      return tokenData.access_token
    } catch (error) {
      console.error('Error refreshing Zoom token:', error)
      return null
    }
  }

  /**
   * Clear cached token (useful for testing or force refresh)
   */
  static clearCache(): void {
    this.cachedToken = null
  }
}