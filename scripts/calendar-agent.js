#!/usr/bin/env node

/**
 * Calendar Agent CLI - Standalone script to manage calendar operations
 * Usage: node scripts/calendar-agent.js <command> [options]
 */

const { createCalendarService } = require('../src/lib/calendarService.ts')

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case 'availability':
      await getAvailability(args[1], args[2], args[3])
      break
    case 'create-event':
      await createEvent(JSON.parse(args[1]))
      break
    case 'update-event':
      await updateEvent(JSON.parse(args[1]))
      break
    case 'delete-event':
      await deleteEvent(JSON.parse(args[1]))
      break
    case 'help':
    default:
      showHelp()
  }
}

async function getAvailability(coachId, serviceId, date) {
  try {
    const calendarService = await createCalendarService(coachId)
    const availability = await calendarService.getAvailability(coachId, serviceId, new Date(date))
    console.log(JSON.stringify(availability, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

async function createEvent(booking) {
  try {
    const calendarService = await createCalendarService(booking.coachId)
    const eventId = await calendarService.createCalendarEvent({
      ...booking,
      startTime: new Date(booking.startTime),
      endTime: new Date(booking.endTime)
    })
    console.log('Created event:', eventId)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

async function updateEvent(booking) {
  try {
    const calendarService = await createCalendarService(booking.coachId)
    const success = await calendarService.updateCalendarEvent({
      ...booking,
      startTime: new Date(booking.startTime),
      endTime: new Date(booking.endTime)
    })
    console.log('Updated event:', success)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

async function deleteEvent(booking) {
  try {
    const calendarService = await createCalendarService(booking.coachId)
    const success = await calendarService.deleteCalendarEvent(booking)
    console.log('Deleted event:', success)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

function showHelp() {
  console.log(`
Calendar Agent CLI

Usage:
  node scripts/calendar-agent.js <command> [options]

Commands:
  availability <coachId> <serviceId> <date>     Get available slots
  create-event '<booking-json>'                 Create calendar event
  update-event '<booking-json>'                 Update calendar event  
  delete-event '<booking-json>'                 Delete calendar event
  help                                          Show this help

Examples:
  node scripts/calendar-agent.js availability coach-123 service-456 "2024-01-15"
  
  node scripts/calendar-agent.js create-event '{"coachId":"coach-123","serviceId":"service-456","clientEmail":"client@example.com","clientName":"John Doe","startTime":"2024-01-15T10:00:00.000Z","endTime":"2024-01-15T11:00:00.000Z","title":"Coaching Session"}'
`)
}

if (require.main === module) {
  main().catch(console.error)
}