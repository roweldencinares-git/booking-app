#!/usr/bin/env node

/**
 * Automation Agent CLI Runner
 * 
 * This script provides command-line access to the automation functions
 * for the booking system. It can be run directly with Node.js or via npm scripts.
 * 
 * Usage:
 *   node scripts/automation-agent.js <command> [args...]
 *   npm run automation <command> [args...]
 * 
 * Commands:
 *   daily-summary [date]                    - Send daily summary email to admins
 *   follow-up [daysAfter]                   - Generate follow-up emails for completed bookings
 *   bulk-reschedule <coachId> <start> <end> <newStart> <newEnd> - Bulk reschedule bookings
 * 
 * Examples:
 *   npm run automation daily-summary
 *   npm run automation daily-summary 2025-01-15
 *   npm run automation follow-up
 *   npm run automation follow-up 3
 *   npm run automation bulk-reschedule user123 2025-01-20 2025-01-22 2025-01-25 2025-01-27
 */

// For development, we need to compile TypeScript on the fly
// In production, you might want to compile the TypeScript first
const { execSync } = require('child_process')
const path = require('path')

// Check if we're in development mode (has TypeScript files)
const fs = require('fs')
const tsFile = path.join(__dirname, '..', 'src', 'lib', 'automationScripts.ts')
const jsFile = path.join(__dirname, '..', 'dist', 'lib', 'automationScripts.js')

async function runAutomationCommand() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`
🤖 Booking App Automation Agent

Available commands:
  daily-summary [date]                    - Send daily summary email to admins
                                           Default: today (YYYY-MM-DD format)
  
  follow-up [daysAfter]                   - Generate follow-up emails for completed bookings
                                           Default: 1 day after completion
  
  bulk-reschedule <coachId> <start> <end> <newStart> <newEnd>
                                         - Bulk reschedule bookings for a coach
                                           Dates in YYYY-MM-DD format

Examples:
  npm run automation daily-summary
  npm run automation daily-summary 2025-01-15
  npm run automation follow-up
  npm run automation follow-up 3
  npm run automation bulk-reschedule user123 2025-01-20 2025-01-22 2025-01-25 2025-01-27

Environment Variables Required:
  EMAIL_PROVIDER=sendgrid|gmail
  SENDGRID_API_KEY or GMAIL_EMAIL + GMAIL_PASSWORD
  FROM_EMAIL (optional)
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY

Note: Make sure your .env.local file is properly configured.
    `)
    return
  }

  const command = args[0]

  // Validate environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing required Supabase environment variables')
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
    process.exit(1)
  }

  if (!process.env.EMAIL_PROVIDER) {
    console.error('❌ Missing EMAIL_PROVIDER environment variable')
    console.error('   Set EMAIL_PROVIDER to "sendgrid" or "gmail"')
    process.exit(1)
  }

  if (process.env.EMAIL_PROVIDER === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
    console.error('❌ Missing SENDGRID_API_KEY for SendGrid email provider')
    process.exit(1)
  }

  if (process.env.EMAIL_PROVIDER === 'gmail' && (!process.env.GMAIL_EMAIL || !process.env.GMAIL_PASSWORD)) {
    console.error('❌ Missing GMAIL_EMAIL or GMAIL_PASSWORD for Gmail email provider')
    process.exit(1)
  }

  try {
    // Since we're dealing with TypeScript, we'll use ts-node to run it directly
    // First check if ts-node is available
    try {
      require.resolve('ts-node')
    } catch (e) {
      console.log('📦 Installing ts-node for TypeScript execution...')
      execSync('npm install --save-dev ts-node', { cwd: path.join(__dirname, '..'), stdio: 'inherit' })
    }

    // Import and run the automation functions
    const { register } = require('ts-node')
    register({
      project: path.join(__dirname, '..', 'tsconfig.json'),
      transpileOnly: true
    })

    const {
      sendDailySummary,
      generateFollowUpEmails,
      bulkReschedule
    } = require('../src/lib/automationScripts.ts')

    console.log(`🚀 Running automation command: ${command}`)
    console.log(`⏰ Started at: ${new Date().toISOString()}`)

    switch (command) {
      case 'daily-summary':
        const date = args[1]
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          console.error('❌ Invalid date format. Use YYYY-MM-DD')
          process.exit(1)
        }
        await sendDailySummary(date)
        break
      
      case 'follow-up':
        const daysAfter = args[1] ? parseInt(args[1]) : undefined
        if (args[1] && (isNaN(daysAfter) || daysAfter < 0)) {
          console.error('❌ Invalid daysAfter value. Must be a positive number')
          process.exit(1)
        }
        await generateFollowUpEmails(daysAfter)
        break
      
      case 'bulk-reschedule':
        if (args.length < 6) {
          console.error('❌ Missing arguments for bulk-reschedule')
          console.error('   Usage: bulk-reschedule <coachId> <startDate> <endDate> <newStartDate> <newEndDate>')
          console.error('   Example: bulk-reschedule user123 2025-01-20 2025-01-22 2025-01-25 2025-01-27')
          process.exit(1)
        }
        
        const [, coachId, startDate, endDate, newStartDate, newEndDate] = args
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate) || 
            !dateRegex.test(newStartDate) || !dateRegex.test(newEndDate)) {
          console.error('❌ Invalid date format. Use YYYY-MM-DD for all dates')
          process.exit(1)
        }
        
        await bulkReschedule(coachId, startDate, endDate, newStartDate, newEndDate)
        break
      
      default:
        console.error(`❌ Unknown command: ${command}`)
        console.error('   Run without arguments to see available commands')
        process.exit(1)
    }

    console.log(`✅ Command completed successfully at: ${new Date().toISOString()}`)

  } catch (error) {
    console.error('❌ Error running automation command:', error.message)
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Automation agent interrupted')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Automation agent terminated')
  process.exit(0)
})

// Run the command
runAutomationCommand().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})