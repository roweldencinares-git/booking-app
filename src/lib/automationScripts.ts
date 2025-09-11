import { supabase, type Booking, type BookingType, type User } from './supabase'
import { createNotificationService, emailConfigs } from './notificationService'
import { BookingService, createBookingService } from './bookingService'
import { format, parseISO, addDays, subDays, addHours, isBefore, isAfter } from 'date-fns'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface DailySummaryData {
  date: string
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  completedBookings: number
  revenue: number
  upcomingBookings: Booking[]
  newBookings: Booking[]
  coaches: {
    [coachId: string]: {
      name: string
      bookings: number
      revenue: number
    }
  }
}

interface FollowUpEmail {
  bookingId: string
  clientName: string
  clientEmail: string
  bookingType: string
  completedDate: string
  emailType: 'feedback' | 'upsell' | 'rebooking'
  emailContent: {
    subject: string
    html: string
    text: string
  }
}

interface BulkRescheduleResult {
  successCount: number
  failureCount: number
  results: {
    bookingId: string
    status: 'success' | 'failed'
    newDate?: string
    error?: string
  }[]
}

/**
 * Automation Agent - Main class for running automated tasks
 */
export class AutomationAgent {
  private notificationService: any
  
  constructor() {
    // Initialize notification service with environment config
    const emailProvider = process.env.EMAIL_PROVIDER as 'sendgrid' | 'gmail'
    
    if (emailProvider === 'sendgrid') {
      this.notificationService = createNotificationService(
        emailConfigs.sendgrid(process.env.SENDGRID_API_KEY!)
      )
    } else if (emailProvider === 'gmail') {
      this.notificationService = createNotificationService(
        emailConfigs.gmail(process.env.GMAIL_EMAIL!, process.env.GMAIL_PASSWORD!)
      )
    }
  }

  /**
   * Generate and send daily summary email to admin
   */
  async sendDailySummary(date: string = format(new Date(), 'yyyy-MM-dd')): Promise<DailySummaryData> {
    console.log(`📊 Generating daily summary for ${date}...`)
    
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`
    
    // Fetch all bookings for the day
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_types (name, price),
        users!bookings_user_id_fkey (first_name, last_name, email)
      `)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .order('start_time', { ascending: true })

    if (bookingsError) {
      throw new Error(`Failed to fetch daily bookings: ${bookingsError.message}`)
    }

    // Calculate summary statistics
    const confirmedBookings = bookings?.filter(b => b.status === 'confirmed') || []
    const cancelledBookings = bookings?.filter(b => b.status === 'cancelled') || []
    const completedBookings = bookings?.filter(b => b.status === 'completed') || []
    
    const revenue = confirmedBookings.reduce((total, booking) => {
      return total + (booking.booking_types?.price || 0)
    }, 0)

    // Get upcoming bookings (next 7 days)
    const nextWeek = format(addDays(parseISO(startOfDay), 7), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    const { data: upcomingBookings } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_types (name),
        users!bookings_user_id_fkey (first_name, last_name)
      `)
      .eq('status', 'confirmed')
      .gte('start_time', endOfDay)
      .lte('start_time', nextWeek)
      .order('start_time', { ascending: true })
      .limit(10)

    // Get new bookings created today
    const { data: newBookings } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_types (name),
        users!bookings_user_id_fkey (first_name, last_name)
      `)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: false })

    // Group by coaches
    const coaches: DailySummaryData['coaches'] = {}
    bookings?.forEach(booking => {
      const userId = booking.user_id
      const user = booking.users as any
      const coachName = user ? `${user.first_name} ${user.last_name}` : 'Unknown Coach'
      
      if (!coaches[userId]) {
        coaches[userId] = {
          name: coachName,
          bookings: 0,
          revenue: 0
        }
      }
      
      if (booking.status === 'confirmed') {
        coaches[userId].bookings++
        coaches[userId].revenue += booking.booking_types?.price || 0
      }
    })

    const summaryData: DailySummaryData = {
      date,
      totalBookings: bookings?.length || 0,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: cancelledBookings.length,
      completedBookings: completedBookings.length,
      revenue,
      upcomingBookings: upcomingBookings || [],
      newBookings: newBookings || [],
      coaches
    }

    // Send email to admin users
    const { data: adminUsers } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('role', 'admin')

    if (adminUsers && adminUsers.length > 0 && this.notificationService) {
      const emailTemplate = this.generateDailySummaryEmail(summaryData)
      
      for (const admin of adminUsers) {
        try {
          await this.notificationService.transporter.sendMail({
            from: `"Booking System" <${process.env.FROM_EMAIL || 'noreply@booking.com'}>`,
            to: admin.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text
          })
          console.log(`📧 Daily summary sent to ${admin.email}`)
        } catch (error) {
          console.error(`Failed to send summary to ${admin.email}:`, error)
        }
      }
    }

    console.log(`✅ Daily summary generated: ${summaryData.totalBookings} bookings, $${summaryData.revenue} revenue`)
    return summaryData
  }

  /**
   * Generate and send follow-up emails for completed bookings
   */
  async generateFollowUpEmails(daysAfterCompletion: number = 1): Promise<FollowUpEmail[]> {
    console.log(`📧 Generating follow-up emails for bookings completed ${daysAfterCompletion} days ago...`)
    
    const targetDate = format(subDays(new Date(), daysAfterCompletion), 'yyyy-MM-dd')
    const startOfDay = `${targetDate}T00:00:00.000Z`
    const endOfDay = `${targetDate}T23:59:59.999Z`

    // Find completed bookings from the target date that haven't received follow-up
    const { data: completedBookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_types (name, price, description)
      `)
      .eq('status', 'completed')
      .gte('end_time', startOfDay)
      .lte('end_time', endOfDay)
      .is('follow_up_sent', null) // Assuming we add this column to track follow-ups

    if (error) {
      throw new Error(`Failed to fetch completed bookings: ${error.message}`)
    }

    const followUpEmails: FollowUpEmail[] = []

    for (const booking of completedBookings || []) {
      // Determine follow-up type based on booking history and value
      const emailType = await this.determineFollowUpType(booking)
      const emailContent = await this.generateFollowUpContent(booking, emailType)
      
      const followUpEmail: FollowUpEmail = {
        bookingId: booking.id,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        bookingType: booking.booking_types?.name || 'Service',
        completedDate: booking.end_time,
        emailType,
        emailContent
      }

      followUpEmails.push(followUpEmail)

      // Send the email
      if (this.notificationService) {
        try {
          await this.notificationService.transporter.sendMail({
            from: `"Booking System" <${process.env.FROM_EMAIL || 'noreply@booking.com'}>`,
            to: booking.client_email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
          })

          // Mark as follow-up sent (you'd need to add this column to your schema)
          await supabase
            .from('bookings')
            .update({ follow_up_sent: new Date().toISOString() })
            .eq('id', booking.id)

          console.log(`📧 Follow-up email sent to ${booking.client_email} for ${emailType}`)
        } catch (error) {
          console.error(`Failed to send follow-up to ${booking.client_email}:`, error)
        }
      }
    }

    console.log(`✅ Generated ${followUpEmails.length} follow-up emails`)
    return followUpEmails
  }

  /**
   * Bulk reschedule bookings for a coach within a date range
   */
  async bulkReschedule(
    coachId: string, 
    dateRange: { start: string; end: string },
    newAvailabilityWindows: { start: string; end: string }[]
  ): Promise<BulkRescheduleResult> {
    console.log(`🔄 Bulk rescheduling bookings for coach ${coachId} from ${dateRange.start} to ${dateRange.end}...`)
    
    // Get all confirmed bookings for the coach in the date range
    const { data: bookingsToReschedule, error } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_types (duration)
      `)
      .eq('user_id', coachId)
      .eq('status', 'confirmed')
      .gte('start_time', `${dateRange.start}T00:00:00.000Z`)
      .lte('start_time', `${dateRange.end}T23:59:59.999Z`)
      .order('start_time', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch bookings to reschedule: ${error.message}`)
    }

    const result: BulkRescheduleResult = {
      successCount: 0,
      failureCount: 0,
      results: []
    }

    if (!bookingsToReschedule || bookingsToReschedule.length === 0) {
      console.log('📝 No bookings found to reschedule')
      return result
    }

    // Create booking service for the coach
    const { data: user } = await supabase
      .from('users')
      .select('clerk_user_id')
      .eq('id', coachId)
      .single()

    if (!user) {
      throw new Error('Coach not found')
    }

    const bookingService = await createBookingService(user.clerk_user_id)

    // Find available slots in the new windows
    const availableSlots = await this.findAvailableSlots(
      coachId, 
      newAvailabilityWindows, 
      bookingsToReschedule.map(b => b.booking_types?.duration || 60)
    )

    // Reschedule each booking
    for (let i = 0; i < bookingsToReschedule.length; i++) {
      const booking = bookingsToReschedule[i]
      const availableSlot = availableSlots[i]

      try {
        if (!availableSlot) {
          throw new Error('No available slot found')
        }

        // Reschedule the booking
        await bookingService.rescheduleBooking(booking.id, {
          newStartTime: availableSlot.start,
          notes: `Automatically rescheduled due to coach unavailability. Original time: ${format(parseISO(booking.start_time), 'PPp')}`
        })

        // Send notification to client
        if (this.notificationService) {
          const emailTemplate = this.generateRescheduleNotificationEmail(booking, availableSlot)
          await this.notificationService.transporter.sendMail({
            from: `"Booking System" <${process.env.FROM_EMAIL || 'noreply@booking.com'}>`,
            to: booking.client_email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text
          })
        }

        result.successCount++
        result.results.push({
          bookingId: booking.id,
          status: 'success',
          newDate: availableSlot.start
        })

        console.log(`✅ Rescheduled booking ${booking.id} to ${availableSlot.start}`)
      } catch (error) {
        result.failureCount++
        result.results.push({
          bookingId: booking.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        console.error(`❌ Failed to reschedule booking ${booking.id}:`, error)
      }
    }

    console.log(`🎯 Bulk reschedule completed: ${result.successCount} success, ${result.failureCount} failures`)
    return result
  }

  /**
   * Private helper methods
   */
  private async determineFollowUpType(booking: Booking): Promise<'feedback' | 'upsell' | 'rebooking'> {
    // Check booking history for this client
    const { data: clientHistory } = await supabase
      .from('bookings')
      .select('id, status, booking_types(price)')
      .eq('client_email', booking.client_email)
      .eq('status', 'completed')

    const completedBookings = clientHistory?.length || 0
    const totalSpent = clientHistory?.reduce((sum, b) => sum + (b.booking_types?.price || 0), 0) || 0

    // Determine follow-up strategy
    if (completedBookings === 1) {
      return 'feedback' // First-time client
    } else if (totalSpent > 500) {
      return 'upsell' // High-value client
    } else {
      return 'rebooking' // Regular client
    }
  }

  private async generateFollowUpContent(booking: Booking, type: 'feedback' | 'upsell' | 'rebooking') {
    const bookingType = (booking as any).booking_types?.name || 'service'
    
    switch (type) {
      case 'feedback':
        return {
          subject: `How was your ${bookingType} session?`,
          text: `Hi ${booking.client_name},\n\nThank you for choosing our ${bookingType} service! We hope you had a great experience.\n\nWe'd love to hear your feedback to help us improve our services. Could you take a moment to share your thoughts?\n\nBest regards,\nYour Team`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Thank you for your ${bookingType} session!</h2>
            <p>Hi ${booking.client_name},</p>
            <p>We hope you had a wonderful experience with your recent ${bookingType} session.</p>
            <p>Your feedback is incredibly valuable to us. Would you mind sharing your thoughts about your experience?</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Share Feedback</a>
            </div>
            <p>Thank you for trusting us with your needs!</p>
            <p>Best regards,<br>Your Team</p>
          </div>`
        }
      
      case 'upsell':
        return {
          subject: `Exclusive offers for valued clients like you`,
          text: `Hi ${booking.client_name},\n\nThank you for being such a valued client! We have some exclusive premium services that might interest you.\n\nAs someone who appreciates quality, you might enjoy our advanced packages with additional benefits.\n\nWould you like to learn more about these exclusive offerings?\n\nBest regards,\nYour Team`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Exclusive offers for our valued clients</h2>
            <p>Hi ${booking.client_name},</p>
            <p>Thank you for being such a loyal client! We have some exciting premium services that we think you'd love.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>🌟 Premium Package Benefits:</h3>
              <ul>
                <li>Priority booking slots</li>
                <li>Extended session time</li>
                <li>Personalized service plans</li>
                <li>Exclusive member rates</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Learn More</a>
            </div>
            <p>Best regards,<br>Your Team</p>
          </div>`
        }
      
      case 'rebooking':
        return {
          subject: `Ready for your next ${bookingType} session?`,
          text: `Hi ${booking.client_name},\n\nWe hope you enjoyed your recent ${bookingType} session! It's been a while since we last saw you.\n\nWe have some great availability coming up and would love to welcome you back.\n\nWould you like to schedule your next session?\n\nBest regards,\nYour Team`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Ready for your next session?</h2>
            <p>Hi ${booking.client_name},</p>
            <p>We hope you're doing well! It's been a while since your last ${bookingType} session, and we'd love to welcome you back.</p>
            <p>We have some great time slots available and would be delighted to continue supporting your journey.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Book Now</a>
            </div>
            <p>Looking forward to seeing you again!</p>
            <p>Best regards,<br>Your Team</p>
          </div>`
        }
    }
  }

  private async findAvailableSlots(
    coachId: string, 
    windows: { start: string; end: string }[], 
    durations: number[]
  ): Promise<{ start: string; end: string }[]> {
    const availableSlots: { start: string; end: string }[] = []
    
    for (let i = 0; i < durations.length; i++) {
      const duration = durations[i]
      
      for (const window of windows) {
        const windowStart = parseISO(window.start)
        const windowEnd = parseISO(window.end)
        let currentSlot = windowStart
        
        while (isBefore(addHours(currentSlot, duration / 60), windowEnd)) {
          const slotEnd = addHours(currentSlot, duration / 60)
          
          // Check if this slot is available
          const { data: conflicts } = await supabase
            .from('bookings')
            .select('id')
            .eq('user_id', coachId)
            .eq('status', 'confirmed')
            .gte('start_time', currentSlot.toISOString())
            .lt('start_time', slotEnd.toISOString())
          
          if (!conflicts || conflicts.length === 0) {
            availableSlots.push({
              start: currentSlot.toISOString(),
              end: slotEnd.toISOString()
            })
            break // Found a slot for this booking
          }
          
          // Move to next 30-minute slot
          currentSlot = addHours(currentSlot, 0.5)
        }
        
        if (availableSlots.length > i) break // Found slot for this booking
      }
    }
    
    return availableSlots
  }

  private generateDailySummaryEmail(data: DailySummaryData) {
    const subject = `Daily Booking Summary - ${format(parseISO(data.date), 'MMMM dd, yyyy')}`
    
    const text = `
Daily Booking Summary for ${format(parseISO(data.date), 'MMMM dd, yyyy')}

Overview:
- Total Bookings: ${data.totalBookings}
- Confirmed: ${data.confirmedBookings}
- Cancelled: ${data.cancelledBookings}
- Completed: ${data.completedBookings}
- Revenue: $${data.revenue}

Upcoming Bookings (Next 7 days): ${data.upcomingBookings.length}
New Bookings Today: ${data.newBookings.length}

Coach Performance:
${Object.entries(data.coaches).map(([id, coach]) => 
  `- ${coach.name}: ${coach.bookings} bookings, $${coach.revenue} revenue`
).join('\n')}
    `.trim()

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1e293b; border-bottom: 3px solid #4f46e5; padding-bottom: 10px;">
    📊 Daily Booking Summary
  </h1>
  <p style="color: #64748b; font-size: 18px;">${format(parseISO(data.date), 'EEEE, MMMM dd, yyyy')}</p>
  
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0;">
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
      <h3 style="margin: 0; color: #0ea5e9;">Total Bookings</h3>
      <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #1e293b;">${data.totalBookings}</p>
    </div>
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e;">
      <h3 style="margin: 0; color: #22c55e;">Confirmed</h3>
      <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #1e293b;">${data.confirmedBookings}</p>
    </div>
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
      <h3 style="margin: 0; color: #ef4444;">Cancelled</h3>
      <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #1e293b;">${data.cancelledBookings}</p>
    </div>
    <div style="background: #f7fee7; padding: 20px; border-radius: 8px; border-left: 4px solid #84cc16;">
      <h3 style="margin: 0; color: #84cc16;">Revenue</h3>
      <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #1e293b;">$${data.revenue}</p>
    </div>
  </div>

  <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 20px 0;">
    <h2 style="color: #1e293b; margin-top: 0;">👥 Coach Performance</h2>
    ${Object.entries(data.coaches).map(([id, coach]) => `
      <div style="display: flex; justify-content: between; align-items: center; padding: 10px; border-bottom: 1px solid #e2e8f0;">
        <span style="font-weight: 500; color: #1e293b;">${coach.name}</span>
        <span style="color: #64748b;">${coach.bookings} bookings • $${coach.revenue} revenue</span>
      </div>
    `).join('')}
  </div>

  <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #1e293b; margin-top: 0;">📅 Upcoming Highlights</h2>
    <p style="color: #64748b;">
      <strong>${data.upcomingBookings.length}</strong> confirmed bookings in the next 7 days<br>
      <strong>${data.newBookings.length}</strong> new bookings created today
    </p>
  </div>
</div>
    `

    return { subject, text, html }
  }

  private generateRescheduleNotificationEmail(booking: Booking, newSlot: { start: string; end: string }) {
    const oldDate = format(parseISO(booking.start_time), 'EEEE, MMMM dd, yyyy \'at\' h:mm a')
    const newDate = format(parseISO(newSlot.start), 'EEEE, MMMM dd, yyyy \'at\' h:mm a')
    
    return {
      subject: `Important: Your appointment has been rescheduled`,
      text: `Hi ${booking.client_name},\n\nWe need to reschedule your upcoming appointment due to unexpected coach unavailability.\n\nOriginal: ${oldDate}\nNew Time: ${newDate}\n\nWe apologize for any inconvenience and appreciate your understanding.\n\nBest regards,\nYour Booking Team`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0;">⚠️ Appointment Rescheduled</h1>
  </div>
  <div style="background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p>Hi ${booking.client_name},</p>
    <p>We need to reschedule your upcoming appointment due to unexpected coach unavailability.</p>
    
    <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <h4 style="margin: 0; color: #dc2626;">❌ Original Time</h4>
      <p style="margin: 5px 0; color: #374151;">${oldDate}</p>
    </div>
    
    <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <h4 style="margin: 0; color: #059669;">✅ New Time</h4>
      <p style="margin: 5px 0; color: #374151;">${newDate}</p>
    </div>
    
    <p>We sincerely apologize for any inconvenience this may cause and appreciate your understanding.</p>
    <p>If this new time doesn't work for you, please contact us to find an alternative.</p>
    
    <p>Best regards,<br>Your Booking Team</p>
  </div>
</div>
      `
    }
  }
}

/**
 * CLI Functions - Export these for direct Node.js execution
 */

export async function sendDailySummary(date?: string): Promise<void> {
  const agent = new AutomationAgent()
  try {
    const summary = await agent.sendDailySummary(date)
    console.log('Daily summary sent successfully:', summary)
  } catch (error) {
    console.error('Failed to send daily summary:', error)
    process.exit(1)
  }
}

export async function generateFollowUpEmails(daysAfter?: number): Promise<void> {
  const agent = new AutomationAgent()
  try {
    const emails = await agent.generateFollowUpEmails(daysAfter)
    console.log(`Generated ${emails.length} follow-up emails`)
  } catch (error) {
    console.error('Failed to generate follow-up emails:', error)
    process.exit(1)
  }
}

export async function bulkReschedule(
  coachId: string, 
  startDate: string, 
  endDate: string,
  newStartDate: string,
  newEndDate: string
): Promise<void> {
  const agent = new AutomationAgent()
  try {
    const result = await agent.bulkReschedule(
      coachId,
      { start: startDate, end: endDate },
      [{ start: newStartDate, end: newEndDate }]
    )
    console.log('Bulk reschedule completed:', result)
  } catch (error) {
    console.error('Failed to bulk reschedule:', error)
    process.exit(1)
  }
}

// CLI execution when run directly
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'daily-summary':
      sendDailySummary(args[1])
      break
    
    case 'follow-up':
      generateFollowUpEmails(args[1] ? parseInt(args[1]) : undefined)
      break
    
    case 'bulk-reschedule':
      if (args.length < 5) {
        console.error('Usage: node automationScripts.js bulk-reschedule <coachId> <startDate> <endDate> <newStartDate> <newEndDate>')
        process.exit(1)
      }
      bulkReschedule(args[1], args[2], args[3], args[4], args[5])
      break
    
    default:
      console.log(`
Available commands:
  daily-summary [date]                    - Send daily summary (default: today)
  follow-up [daysAfter]                   - Generate follow-up emails (default: 1 day)
  bulk-reschedule <coach> <start> <end> <newStart> <newEnd> - Reschedule bookings
      `)
  }
}