# 🚀 MARVA Booking App - Quick Node Shortcuts

## Quick Access Commands

Just like the Bucks system's agent shortcuts, use these to quickly access booking app nodes:

### 📍 NODE SHORTCUTS

| Command | Node | Purpose |
|---------|------|---------|
| **n1** | CLIENT-NODE | Client management, preferences, history |
| **n2** | STAFF-NODE | Provider availability, integrations |
| **n3** | BOOKING-NODE | Core scheduling engine |
| **n4** | CALENDAR-NODE | Google Calendar sync |
| **n5** | MEETING-NODE | Zoom integration |
| **n6** | COMMUNICATION-NODE | Email notifications (planned) |
| **n7** | GUARDRAIL-NODE | Business rules & validation |

### ⚡ OPERATION SHORTCUTS

| Command | Action |
|---------|--------|
| **book** | Create new booking |
| **cancel** | Cancel existing booking |
| **reschedule** | Reschedule booking to new time |
| **check** | Check time slot availability |

### 🔗 INTEGRATION SHORTCUTS

| Command | Integration |
|---------|-------------|
| **gcal** | Google Calendar sync |
| **zoom** | Zoom meeting creation |
| **email** | Send notification email |

### 👤 ADMIN SHORTCUTS

| Command | Function |
|---------|----------|
| **staff** | Manage staff/providers |
| **rules** | View guardrails & business rules |
| **clients** | List all clients |

## Usage Examples

### In Your Code

```typescript
import { getNode, getNodeDetails } from '@/marva/nodeShortcuts'

// Get node name
const node = getNode('n3') // Returns: "BOOKING-NODE"

// Get full node details
await getNodeDetails('n3')
// Prints: responsibilities, SPHERE capabilities, API endpoints
```

### From Command Line

```bash
# List all shortcuts
cd booking-app
npm run marva:shortcuts

# Get details for specific node
npm run marva:node n3

# Check what operations are available
npm run marva:ops
```

### With Claude Code

When working with Claude, just say:

- **"Work on n3"** → Focus on BOOKING-NODE
- **"Check n4 integrations"** → Review CALENDAR-NODE
- **"Update n7 rules"** → Modify GUARDRAIL-NODE
- **"Use book shortcut"** → Create booking operation

## Adding to package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "marva:shortcuts": "tsx src/marva/nodeShortcuts.ts",
    "marva:node": "tsx src/marva/nodeShortcuts.ts",
    "marva:ops": "echo 'book, cancel, reschedule, check'"
  }
}
```

## Quick Reference Card

```
╔═══════════════════════════════════════════════════════════╗
║         MARVA BOOKING APP - QUICK REFERENCE               ║
╠═══════════════════════════════════════════════════════════╣
║ NODES:    n1-n7 (CLIENT, STAFF, BOOKING, CALENDAR...)    ║
║ OPS:      book, cancel, reschedule, check                 ║
║ ADMIN:    staff, rules, clients                           ║
║ SPHERE:   Always follows S→P→H→E→R→E pattern             ║
╚═══════════════════════════════════════════════════════════╝
```

## Integration with CLAUDE.md

Update your `CLAUDE.md` to include:

```markdown
## Quick Node Shortcuts 🚀

- **`n1`** = Client Node (client management)
- **`n2`** = Staff Node (provider availability)
- **`n3`** = Booking Node (core scheduling)
- **`n4`** = Calendar Node (Google Calendar)
- **`n5`** = Meeting Node (Zoom integration)
- **`n6`** = Communication Node (notifications)
- **`n7`** = Guardrail Node (business rules)

### Operations
- **`book`** = Create booking
- **`cancel`** = Cancel booking
- **`reschedule`** = Reschedule booking
- **`check`** = Check availability
```

---

**Remember**: Every operation follows SPHERE pattern (Scan → Plan → Heal → Examine → Reinforce → Evolve)

**Fractal Dimension**: 0.580 across all nodes
