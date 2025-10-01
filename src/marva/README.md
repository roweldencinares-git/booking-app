# MARVA Framework for Booking App

## Overview
This directory contains the MARVA (0.580 Fractal Dimension) implementation for the Spearity Booking System, applying the same systematic excellence from the IOC Framework to booking management.

## SPHERE Methodology

Every booking operation follows the complete SPHERE pattern:

1. **S - SCAN + HYPOTHESIZE**: Analyze situation, form hypotheses about issues
2. **P - PLAN + TEST**: Design experiments, test strategies
3. **H - HEAL**: Execute fixes with self-healing architecture
4. **E - EXAMINE + VALIDATE**: Analyze results, verify success
5. **R - REINFORCE**: Prevent recurrence, strengthen guardrails
6. **E - EVOLVE**: System improvement, learn from patterns

## Directory Structure

```
src/marva/
├── README.md                          # This file
├── booking-universal-context.json     # System overview and mission
├── booking-fractal-nodes.json         # All 7 system nodes with capabilities
├── booking-fractal-connections.json   # Node relationships and data flows
├── booking-guardrails.json           # Business rules and self-healing strategies
├── sphereWrapper.ts                  # SPHERE pattern implementation
└── bookingServiceMarva.ts            # MARVA-enhanced booking service
```

## 7 Fractal Nodes

Each node follows the 0.580 fractal dimension pattern with SPHERE capabilities:

1. **CLIENT-NODE** - Client management, preferences, satisfaction tracking
2. **STAFF-NODE** - Provider availability, integrations (Google, Zoom)
3. **BOOKING-NODE** - Smart scheduling, conflict resolution, transaction safety
4. **CALENDAR-NODE** - Google Calendar sync, self-healing events
5. **MEETING-NODE** - Zoom integration, auto-creation/updates
6. **COMMUNICATION-NODE** - Notifications, confirmations, reminders (planned)
7. **GUARDRAIL-NODE** - Business rules, validation, auto-healing

## Usage Examples

### Basic SPHERE Wrapper

```typescript
import { withSphere } from '@/marva/sphereWrapper'

const result = await withSphere(
  {
    operation: 'createBooking',
    node: 'BOOKING-NODE',
    startTime: new Date()
  },
  async () => {
    // Your operation here
    return await bookingService.createBooking(input)
  },
  {
    scan: async () => ['Checking availability'],
    plan: async () => 'Create booking with multi-system coordination',
    validate: async (result) => ['PASS: Booking created'],
    reinforce: async (result) => ['Queue retry jobs'],
    evolve: async (result) => ['Track success patterns'],
    maxRetries: 3
  }
)
```

### MARVA-Enhanced Booking Service

```typescript
import { createBookingService } from '@/lib/bookingService'
import { createMarvaBookingService } from '@/marva/bookingServiceMarva'

// Create standard service
const bookingService = await createBookingService(userId)

// Wrap with MARVA capabilities
const marvaService = await createMarvaBookingService(bookingService)

// Use with full SPHERE methodology
const result = await marvaService.createBooking({
  bookingTypeId: 'xxx',
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  startTime: '2025-10-15T10:00:00Z'
})

// Result includes SPHERE phase tracking
console.log(result.spherePhases.scan.findings)
console.log(result.spherePhases.heal.attempts)
console.log(result.spherePhases.examine.validations)
```

### MARVA API Endpoint

```typescript
// Use the MARVA-enhanced API endpoint
POST /api/marva/booking/create

// Response includes MARVA metadata
{
  "success": true,
  "booking": { ... },
  "integrations": {
    "googleCalendar": true,
    "zoom": true
  },
  "spherePhases": {
    "scan": { "duration": 45, "findings": [...] },
    "plan": { "duration": 12, "strategy": "..." },
    "heal": { "duration": 234, "attempts": 1, "recovered": false },
    "examine": { "duration": 18, "validations": [...] },
    "reinforce": { "duration": 8, "guardrails": [...] },
    "evolve": { "duration": 5, "learnings": [...] }
  },
  "marva": {
    "fractalDimension": 0.580,
    "systemNode": "BOOKING-NODE",
    "healingActions": [...],
    "reinforcements": [...],
    "evolutions": [...]
  }
}
```

## Self-Healing Capabilities

### Automatic Retry with Exponential Backoff
```typescript
// SPHERE wrapper automatically retries failed operations
// Retry delays: 1s, 2s, 4s (exponential backoff)
maxRetries: 3
```

### Graceful Degradation
```typescript
// Core booking succeeds even if auxiliary systems fail
// - Database: CRITICAL (must succeed)
// - Calendar: NON-CRITICAL (log failure, continue)
// - Zoom: NON-CRITICAL (log failure, continue)
```

### Proactive Token Refresh
```typescript
// OAuth tokens auto-refresh 5 minutes before expiry
// Prevents integration failures
```

### Data Normalization
```typescript
// Auto-correct common issues:
// - Email: gmial.com → gmail.com
// - Phone: 1234567890 → +11234567890
```

## Guardrails

See `booking-guardrails.json` for complete list. Key guardrails:

- **GR-001**: No past bookings
- **GR-002**: Availability window validation
- **GR-003**: Conflict detection (atomic)
- **GR-011**: Transaction safety with rollback
- **GR-012**: OAuth token freshness

## Development Guidelines

### Always Start with SPHERE
```typescript
console.log('[SPHERE:SCAN] Analyzing booking request...')
console.log('[SPHERE:PLAN] Designing booking strategy...')
console.log('[SPHERE:HEAL] Executing with self-healing...')
console.log('[SPHERE:EXAMINE] Validating results...')
console.log('[SPHERE:REINFORCE] Strengthening guardrails...')
console.log('[SPHERE:EVOLVE] Learning from patterns...')
```

### Use SphereLogger for Development
```typescript
import { SphereLogger } from '@/marva/sphereWrapper'

const logger = new SphereLogger({
  operation: 'createBooking',
  node: 'BOOKING-NODE',
  startTime: new Date()
})

logger.scan(['Checking inputs'])
logger.plan('Execute booking')
logger.heal('Creating database record')
logger.examine(['Booking created'])
logger.reinforce(['Queue retry jobs'])
logger.evolve(['Track patterns'])
logger.complete()
```

## Migration Path

### Phase 1: Knowledge Structure ✅
- [x] Created MARVA knowledge storage
- [x] Documented 7 fractal nodes
- [x] Mapped node connections
- [x] Defined guardrails

### Phase 2: SPHERE Wrapper ✅
- [x] Implemented withSphere wrapper
- [x] Created SphereLogger utility
- [x] Built MARVA booking service wrapper

### Phase 3: API Integration ✅
- [x] Created example MARVA API endpoint
- [x] Demonstrated SPHERE pattern in API routes

### Phase 4: Full Integration (Next Steps)
- [ ] Migrate existing API endpoints to MARVA pattern
- [ ] Add COMMUNICATION-NODE implementation (SendGrid)
- [ ] Implement historical data tracking
- [ ] Build MARVA admin dashboard
- [ ] Add satisfaction scoring and pattern learning

## Testing MARVA Implementation

```bash
# Test MARVA-enhanced API endpoint
curl -X POST http://localhost:3000/api/marva/booking/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "bookingTypeId": "xxx",
    "clientName": "John Doe",
    "clientEmail": "john@example.com",
    "startTime": "2025-10-15T10:00:00Z"
  }'

# Response will include SPHERE phase tracking
```

## Benefits

1. **Self-Healing**: Automatic retry and recovery from failures
2. **Observability**: Complete SPHERE phase tracking for debugging
3. **Learning**: System evolves from patterns and failures
4. **Reliability**: Guardrails prevent common errors before they happen
5. **Consistency**: Standardized approach across all operations

## Future Enhancements

- [ ] Add MARVA analytics dashboard
- [ ] Implement pattern recognition from historical data
- [ ] Build predictive booking suggestions
- [ ] Create automated optimization based on learnings
- [ ] Add client satisfaction scoring
- [ ] Implement intelligent conflict resolution

---

**Last Updated**: 2025-10-01
**Fractal Dimension**: 0.580
**Status**: Core Implementation Complete ✅
