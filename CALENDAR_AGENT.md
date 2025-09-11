# Calendar Agent Usage Guide

## Quick Commands

### CLI Usage (Terminal)
```bash
# Get availability
npm run calendar availability coach-123 service-456 "2024-01-15"

# Create event
npm run calendar create-event '{"coachId":"coach-123","serviceId":"service-456","clientEmail":"client@example.com","clientName":"John Doe","startTime":"2024-01-15T10:00:00.000Z","endTime":"2024-01-15T11:00:00.000Z","title":"Coaching Session"}'

# Update event  
npm run calendar update-event '{"id":"booking-789","calendarEventId":"event-123","coachId":"coach-123","clientEmail":"client@example.com","clientName":"John Doe","startTime":"2024-01-15T11:00:00.000Z","endTime":"2024-01-15T12:00:00.000Z","title":"Coaching Session Updated"}'

# Delete event
npm run calendar delete-event '{"calendarEventId":"event-123","coachId":"coach-123"}'
```

### HTTP API Usage
```bash
# Get availability
curl "http://localhost:3000/api/calendar/availability?coachId=coach-123&serviceId=service-456&date=2024-01-15"

# Create event
curl -X POST http://localhost:3000/api/calendar/events \
  -H "Content-Type: application/json" \
  -d '{"coachId":"coach-123","serviceId":"service-456","clientEmail":"client@example.com","clientName":"John Doe","startTime":"2024-01-15T10:00:00.000Z","endTime":"2024-01-15T11:00:00.000Z","title":"Coaching Session"}'

# Update event
curl -X PUT http://localhost:3000/api/calendar/events \
  -H "Content-Type: application/json" \
  -d '{"calendarEventId":"event-123","coachId":"coach-123","clientEmail":"client@example.com","clientName":"John Doe","startTime":"2024-01-15T11:00:00.000Z","endTime":"2024-01-15T12:00:00.000Z","title":"Updated Session"}'

# Delete event
curl -X DELETE http://localhost:3000/api/calendar/events \
  -H "Content-Type: application/json" \
  -d '{"calendarEventId":"event-123","coachId":"coach-123"}'
```

### JavaScript/TypeScript Usage
```typescript
import { createCalendarService } from '@/lib/calendarService'

// Create service instance
const calendarService = await createCalendarService('coach-123')

// Get availability
const availability = await calendarService.getAvailability(
  'coach-123', 
  'service-456', 
  new Date('2024-01-15')
)

// Create event
const booking = {
  coachId: 'coach-123',
  serviceId: 'service-456', 
  clientEmail: 'client@example.com',
  clientName: 'John Doe',
  startTime: new Date('2024-01-15T10:00:00.000Z'),
  endTime: new Date('2024-01-15T11:00:00.000Z'),
  title: 'Coaching Session'
}

const eventId = await calendarService.createCalendarEvent(booking)
```

## Key Features

- ✅ **Google Calendar Integration** - Syncs with coach calendars
- ✅ **Availability Detection** - Smart conflict checking using FreeBusy API
- ✅ **Working Hours Support** - Respects coach schedules
- ✅ **Automatic Invitations** - Sends calendar invites to clients
- ✅ **Timezone Handling** - Proper timezone conversion
- ✅ **Buffer Time Support** - Configurable buffer between appointments
- ✅ **CRUD Operations** - Create, read, update, delete calendar events

## Environment Variables Required

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Requirements

Ensure your Supabase tables have these columns:

**users table:**
- `google_calendar_id` (text, optional)
- `google_access_token` (text, optional) 
- `google_refresh_token` (text, optional)
- `working_hours` (jsonb, optional)
- `timezone` (text, default: 'America/New_York')

**booking_types table:**
- `duration_minutes` (integer)
- `buffer_time_minutes` (integer, optional)

**bookings table:**
- `calendar_event_id` (text, optional)