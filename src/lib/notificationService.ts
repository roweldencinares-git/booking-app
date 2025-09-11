import { createTransport, type Transporter } from 'nodemailer'
import { format, parseISO } from 'date-fns'
import { type Booking, type BookingType } from './supabase'

export interface NotificationConfig {
  emailProvider: 'sendgrid' | 'gmail'
  apiKey?: string // SendGrid API key
  email?: string // Gmail email
  password?: string // Gmail app password
  fromName?: string
  fromEmail?: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class NotificationService {
  private transporter: Transporter
  private config: NotificationConfig

  constructor(config: NotificationConfig) {
    this.config = {
      fromName: 'Booking System',
      fromEmail: 'noreply@booking.com',
      ...config
    }

    if (config.emailProvider === 'sendgrid') {
      this.transporter = createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: config.apiKey
        }
      })
    } else if (config.emailProvider === 'gmail') {
      this.transporter = createTransporter({
        service: 'gmail',
        auth: {
          user: config.email,
          pass: config.password
        }
      })
    } else {
      throw new Error('Unsupported email provider')
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(booking: Booking & { booking_types?: BookingType }): Promise<boolean> {
    try {
      const template = this.generateConfirmationTemplate(booking)
      
      await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: booking.client_email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      console.log(`Confirmation email sent to ${booking.client_email} for booking ${booking.id}`)
      return true
    } catch (error) {
      console.error('Failed to send confirmation email:', error)
      return false
    }
  }

  /**
   * Send reminder email
   */
  async sendReminder(booking: Booking & { booking_types?: BookingType }, hoursBefore: number): Promise<boolean> {
    try {
      const template = this.generateReminderTemplate(booking, hoursBefore)
      
      await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: booking.client_email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      console.log(`Reminder email sent to ${booking.client_email} for booking ${booking.id} (${hoursBefore}h before)`)
      return true
    } catch (error) {
      console.error('Failed to send reminder email:', error)
      return false
    }
  }

  /**
   * Send cancellation notice
   */
  async sendCancellationNotice(booking: Booking & { booking_types?: BookingType }): Promise<boolean> {
    try {
      const template = this.generateCancellationTemplate(booking)
      
      await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: booking.client_email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      console.log(`Cancellation email sent to ${booking.client_email} for booking ${booking.id}`)
      return true
    } catch (error) {
      console.error('Failed to send cancellation email:', error)
      return false
    }
  }

  /**
   * Send reschedule notification
   */
  async sendRescheduleNotice(
    oldBooking: Booking & { booking_types?: BookingType },
    newBooking: Booking & { booking_types?: BookingType }
  ): Promise<boolean> {
    try {
      const template = this.generateRescheduleTemplate(oldBooking, newBooking)
      
      await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: newBooking.client_email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      console.log(`Reschedule email sent to ${newBooking.client_email} for booking ${newBooking.id}`)
      return true
    } catch (error) {
      console.error('Failed to send reschedule email:', error)
      return false
    }
  }

  /**
   * Generate confirmation email template
   */
  private generateConfirmationTemplate(booking: Booking & { booking_types?: BookingType }): EmailTemplate {
    const startTime = parseISO(booking.start_time)
    const endTime = parseISO(booking.end_time)
    const bookingTypeName = booking.booking_types?.name || 'Appointment'
    
    const subject = `Booking Confirmed: ${bookingTypeName} on ${format(startTime, 'MMMM dd, yyyy')}`
    
    const text = `
Hello ${booking.client_name},

Your booking has been confirmed!

Booking Details:
- Service: ${bookingTypeName}
- Date: ${format(startTime, 'EEEE, MMMM dd, yyyy')}
- Time: ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}
${booking.zoom_join_url ? `- Meeting Link: ${booking.zoom_join_url}` : ''}
${booking.zoom_password ? `- Meeting Password: ${booking.zoom_password}` : ''}
${booking.notes ? `- Notes: ${booking.notes}` : ''}

We look forward to meeting with you!

Best regards,
Your Booking Team
    `.trim()

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Booking Confirmed! ✅</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 18px; color: #1e293b;">Hello ${booking.client_name},</p>
    
    <p style="color: #475569;">Your booking has been confirmed! Here are your appointment details:</p>
    
    <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4f46e5;">
      <h3 style="margin: 0 0 15px 0; color: #1e293b;">📅 Booking Details</h3>
      <p style="margin: 8px 0; color: #475569;"><strong>Service:</strong> ${bookingTypeName}</p>
      <p style="margin: 8px 0; color: #475569;"><strong>Date:</strong> ${format(startTime, 'EEEE, MMMM dd, yyyy')}</p>
      <p style="margin: 8px 0; color: #475569;"><strong>Time:</strong> ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}</p>
      ${booking.zoom_join_url ? `<p style="margin: 8px 0; color: #475569;"><strong>Meeting Link:</strong> <a href="${booking.zoom_join_url}" style="color: #4f46e5;">${booking.zoom_join_url}</a></p>` : ''}
      ${booking.zoom_password ? `<p style="margin: 8px 0; color: #475569;"><strong>Meeting Password:</strong> ${booking.zoom_password}</p>` : ''}
      ${booking.notes ? `<p style="margin: 8px 0; color: #475569;"><strong>Notes:</strong> ${booking.notes}</p>` : ''}
    </div>
    
    <p style="color: #475569;">We look forward to meeting with you!</p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        Best regards,<br>
        Your Booking Team
      </p>
    </div>
  </div>
</div>
    `

    return { subject, html, text }
  }

  /**
   * Generate reminder email template
   */
  private generateReminderTemplate(booking: Booking & { booking_types?: BookingType }, hoursBefore: number): EmailTemplate {
    const startTime = parseISO(booking.start_time)
    const endTime = parseISO(booking.end_time)
    const bookingTypeName = booking.booking_types?.name || 'Appointment'
    
    const reminderType = hoursBefore === 24 ? 'Tomorrow' : hoursBefore === 1 ? 'In 1 Hour' : `In ${hoursBefore} Hours`
    const subject = `Reminder: ${bookingTypeName} ${reminderType}`
    
    const text = `
Hello ${booking.client_name},

This is a reminder that you have an upcoming appointment:

Booking Details:
- Service: ${bookingTypeName}
- Date: ${format(startTime, 'EEEE, MMMM dd, yyyy')}
- Time: ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}
${booking.zoom_join_url ? `- Meeting Link: ${booking.zoom_join_url}` : ''}
${booking.zoom_password ? `- Meeting Password: ${booking.zoom_password}` : ''}
${booking.notes ? `- Notes: ${booking.notes}` : ''}

Please make sure you're prepared for your session.

See you soon!
Your Booking Team
    `.trim()

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Appointment Reminder ⏰</h1>
  </div>
  
  <div style="background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 18px; color: #1e293b;">Hello ${booking.client_name},</p>
    
    <p style="color: #475569;">This is a reminder that you have an upcoming appointment ${hoursBefore === 24 ? 'tomorrow' : hoursBefore === 1 ? 'in 1 hour' : `in ${hoursBefore} hours`}:</p>
    
    <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 15px 0; color: #1e293b;">📅 Appointment Details</h3>
      <p style="margin: 8px 0; color: #475569;"><strong>Service:</strong> ${bookingTypeName}</p>
      <p style="margin: 8px 0; color: #475569;"><strong>Date:</strong> ${format(startTime, 'EEEE, MMMM dd, yyyy')}</p>
      <p style="margin: 8px 0; color: #475569;"><strong>Time:</strong> ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}</p>
      ${booking.zoom_join_url ? `<p style="margin: 8px 0; color: #475569;"><strong>Meeting Link:</strong> <a href="${booking.zoom_join_url}" style="color: #f59e0b;">${booking.zoom_join_url}</a></p>` : ''}
      ${booking.zoom_password ? `<p style="margin: 8px 0; color: #475569;"><strong>Meeting Password:</strong> ${booking.zoom_password}</p>` : ''}
      ${booking.notes ? `<p style="margin: 8px 0; color: #475569;"><strong>Notes:</strong> ${booking.notes}</p>` : ''}
    </div>
    
    <p style="color: #475569;">Please make sure you're prepared for your session.</p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        See you soon!<br>
        Your Booking Team
      </p>
    </div>
  </div>
</div>
    `

    return { subject, html, text }
  }

  /**
   * Generate cancellation email template
   */
  private generateCancellationTemplate(booking: Booking & { booking_types?: BookingType }): EmailTemplate {
    const startTime = parseISO(booking.start_time)
    const bookingTypeName = booking.booking_types?.name || 'Appointment'
    
    const subject = `Booking Cancelled: ${bookingTypeName} on ${format(startTime, 'MMMM dd, yyyy')}`
    
    const text = `
Hello ${booking.client_name},

We're writing to confirm that your booking has been cancelled.

Cancelled Booking Details:
- Service: ${bookingTypeName}
- Date: ${format(startTime, 'EEEE, MMMM dd, yyyy')}
- Time: ${format(startTime, 'h:mm a')}

If you need to reschedule or have any questions, please don't hesitate to contact us.

Thank you for your understanding.

Best regards,
Your Booking Team
    `.trim()

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Booking Cancelled ❌</h1>
  </div>
  
  <div style="background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 18px; color: #1e293b;">Hello ${booking.client_name},</p>
    
    <p style="color: #475569;">We're writing to confirm that your booking has been cancelled.</p>
    
    <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <h3 style="margin: 0 0 15px 0; color: #1e293b;">📅 Cancelled Booking Details</h3>
      <p style="margin: 8px 0; color: #475569;"><strong>Service:</strong> ${bookingTypeName}</p>
      <p style="margin: 8px 0; color: #475569;"><strong>Date:</strong> ${format(startTime, 'EEEE, MMMM dd, yyyy')}</p>
      <p style="margin: 8px 0; color: #475569;"><strong>Time:</strong> ${format(startTime, 'h:mm a')}</p>
    </div>
    
    <p style="color: #475569;">If you need to reschedule or have any questions, please don't hesitate to contact us.</p>
    
    <p style="color: #475569;">Thank you for your understanding.</p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        Best regards,<br>
        Your Booking Team
      </p>
    </div>
  </div>
</div>
    `

    return { subject, html, text }
  }

  /**
   * Generate reschedule email template
   */
  private generateRescheduleTemplate(
    oldBooking: Booking & { booking_types?: BookingType },
    newBooking: Booking & { booking_types?: BookingType }
  ): EmailTemplate {
    const oldStartTime = parseISO(oldBooking.start_time)
    const newStartTime = parseISO(newBooking.start_time)
    const newEndTime = parseISO(newBooking.end_time)
    const bookingTypeName = newBooking.booking_types?.name || 'Appointment'
    
    const subject = `Booking Rescheduled: ${bookingTypeName} - New Date: ${format(newStartTime, 'MMMM dd, yyyy')}`
    
    const text = `
Hello ${newBooking.client_name},

Your booking has been successfully rescheduled!

Original Date: ${format(oldStartTime, 'EEEE, MMMM dd, yyyy')} at ${format(oldStartTime, 'h:mm a')}

New Booking Details:
- Service: ${bookingTypeName}
- Date: ${format(newStartTime, 'EEEE, MMMM dd, yyyy')}
- Time: ${format(newStartTime, 'h:mm a')} - ${format(newEndTime, 'h:mm a')}
${newBooking.zoom_join_url ? `- Meeting Link: ${newBooking.zoom_join_url}` : ''}
${newBooking.zoom_password ? `- Meeting Password: ${newBooking.zoom_password}` : ''}
${newBooking.notes ? `- Notes: ${newBooking.notes}` : ''}

We look forward to meeting with you at the new time!

Best regards,
Your Booking Team
    `.trim()

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0d9488; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Booking Rescheduled 🔄</h1>
  </div>
  
  <div style="background: #f0fdfa; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 18px; color: #1e293b;">Hello ${newBooking.client_name},</p>
    
    <p style="color: #475569;">Your booking has been successfully rescheduled!</p>
    
    <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <h4 style="margin: 0 0 10px 0; color: #dc2626;">❌ Original Date</h4>
      <p style="margin: 0; color: #475569;">${format(oldStartTime, 'EEEE, MMMM dd, yyyy')} at ${format(oldStartTime, 'h:mm a')}</p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0d9488;">
      <h3 style="margin: 0 0 15px 0; color: #1e293b;">✅ New Booking Details</h3>
      <p style="margin: 8px 0; color: #475569;"><strong>Service:</strong> ${bookingTypeName}</p>
      <p style="margin: 8px 0; color: #475569;"><strong>Date:</strong> ${format(newStartTime, 'EEEE, MMMM dd, yyyy')}</p>
      <p style="margin: 8px 0; color: #475569;"><strong>Time:</strong> ${format(newStartTime, 'h:mm a')} - ${format(newEndTime, 'h:mm a')}</p>
      ${newBooking.zoom_join_url ? `<p style="margin: 8px 0; color: #475569;"><strong>Meeting Link:</strong> <a href="${newBooking.zoom_join_url}" style="color: #0d9488;">${newBooking.zoom_join_url}</a></p>` : ''}
      ${newBooking.zoom_password ? `<p style="margin: 8px 0; color: #475569;"><strong>Meeting Password:</strong> ${newBooking.zoom_password}</p>` : ''}
      ${newBooking.notes ? `<p style="margin: 8px 0; color: #475569;"><strong>Notes:</strong> ${newBooking.notes}</p>` : ''}
    </div>
    
    <p style="color: #475569;">We look forward to meeting with you at the new time!</p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        Best regards,<br>
        Your Booking Team
      </p>
    </div>
  </div>
</div>
    `

    return { subject, html, text }
  }
}

// Utility function to create notification service
export function createNotificationService(config: NotificationConfig): NotificationService {
  return new NotificationService(config)
}

// Example configurations
export const emailConfigs = {
  sendgrid: (apiKey: string): NotificationConfig => ({
    emailProvider: 'sendgrid',
    apiKey,
    fromName: 'Booking System',
    fromEmail: 'noreply@yourdomain.com'
  }),
  
  gmail: (email: string, password: string): NotificationConfig => ({
    emailProvider: 'gmail',
    email,
    password,
    fromName: 'Booking System',
    fromEmail: email
  })
}