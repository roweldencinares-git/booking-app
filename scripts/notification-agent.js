#!/usr/bin/env node

/**
 * Notification Agent - Example Usage
 * 
 * This script demonstrates how to use the NotificationService
 * Run with: node scripts/notification-agent.js
 */

import { createNotificationService, emailConfigs } from '../src/lib/notificationService.js'
import { config } from 'dotenv'

// Load environment variables
config()

async function main() {
  console.log('🔔 Notification Agent - Testing Email Functionality\n')

  // Example booking data
  const sampleBooking = {
    id: 'booking_123',
    booking_type_id: 'type_456',
    user_id: 'user_789',
    client_name: 'John Doe',
    client_email: 'john.doe@example.com',
    client_phone: '+1-555-0123',
    start_time: '2024-01-15T14:00:00Z',
    end_time: '2024-01-15T15:00:00Z',
    status: 'confirmed',
    notes: 'Looking forward to our session!',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
    zoom_join_url: 'https://zoom.us/j/123456789',
    zoom_password: 'pass123',
    booking_types: {
      id: 'type_456',
      user_id: 'user_789',
      name: 'Strategy Consultation',
      duration: 60,
      description: 'Strategic business consultation session',
      price: 150,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  }

  try {
    // Setup notification service
    let notificationService

    // Check which email provider to use
    if (process.env.SENDGRID_API_KEY) {
      console.log('📧 Using SendGrid for email delivery')
      notificationService = createNotificationService(
        emailConfigs.sendgrid(process.env.SENDGRID_API_KEY)
      )
    } else if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
      console.log('📧 Using Gmail SMTP for email delivery')
      notificationService = createNotificationService(
        emailConfigs.gmail(process.env.GMAIL_EMAIL, process.env.GMAIL_APP_PASSWORD)
      )
    } else {
      console.log('⚠️  No email configuration found!')
      console.log('Please set one of the following in your .env file:')
      console.log('- SENDGRID_API_KEY for SendGrid')
      console.log('- GMAIL_EMAIL and GMAIL_APP_PASSWORD for Gmail')
      console.log('\nExample .env entries:')
      console.log('SENDGRID_API_KEY=your_sendgrid_api_key')
      console.log('# OR')
      console.log('GMAIL_EMAIL=your.email@gmail.com')
      console.log('GMAIL_APP_PASSWORD=your_app_password')
      return
    }

    // Test different notification types
    console.log('\n🧪 Testing Notification Functions:\n')

    // 1. Booking Confirmation
    console.log('1️⃣ Sending booking confirmation...')
    const confirmationSent = await notificationService.sendBookingConfirmation(sampleBooking)
    console.log(`   Result: ${confirmationSent ? '✅ Success' : '❌ Failed'}\n`)

    // 2. 24-hour Reminder
    console.log('2️⃣ Sending 24-hour reminder...')
    const reminder24hSent = await notificationService.sendReminder(sampleBooking, 24)
    console.log(`   Result: ${reminder24hSent ? '✅ Success' : '❌ Failed'}\n`)

    // 3. 1-hour Reminder
    console.log('3️⃣ Sending 1-hour reminder...')
    const reminder1hSent = await notificationService.sendReminder(sampleBooking, 1)
    console.log(`   Result: ${reminder1hSent ? '✅ Success' : '❌ Failed'}\n`)

    // 4. Cancellation Notice
    console.log('4️⃣ Sending cancellation notice...')
    const cancelledBooking = { ...sampleBooking, status: 'cancelled' }
    const cancellationSent = await notificationService.sendCancellationNotice(cancelledBooking)
    console.log(`   Result: ${cancellationSent ? '✅ Success' : '❌ Failed'}\n`)

    // 5. Reschedule Notice
    console.log('5️⃣ Sending reschedule notice...')
    const newBooking = {
      ...sampleBooking,
      start_time: '2024-01-16T10:00:00Z',
      end_time: '2024-01-16T11:00:00Z'
    }
    const rescheduleSent = await notificationService.sendRescheduleNotice(sampleBooking, newBooking)
    console.log(`   Result: ${rescheduleSent ? '✅ Success' : '❌ Failed'}\n`)

    console.log('🎉 Notification Agent testing completed!')
    console.log('Check your email inbox for the test notifications.')

  } catch (error) {
    console.error('❌ Error occurred:', error.message)
    process.exit(1)
  }
}

// Handle command line arguments
const command = process.argv[2]

if (command === 'help' || command === '--help' || command === '-h') {
  console.log(`
🔔 Notification Agent

Usage:
  node scripts/notification-agent.js              Run all notification tests
  node scripts/notification-agent.js help         Show this help message

Environment Variables:
  SENDGRID_API_KEY                                SendGrid API key
  GMAIL_EMAIL                                     Gmail email address  
  GMAIL_APP_PASSWORD                              Gmail app password

Examples:
  # Using SendGrid
  SENDGRID_API_KEY=sg.xxx node scripts/notification-agent.js
  
  # Using Gmail
  GMAIL_EMAIL=you@gmail.com GMAIL_APP_PASSWORD=xxx node scripts/notification-agent.js
`)
  process.exit(0)
}

// Run the main function
main().catch(console.error)