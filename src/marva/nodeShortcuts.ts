/**
 * MARVA Node Shortcuts for Booking App
 * Quick access to fractal nodes with SPHERE pattern enforcement
 */

export const NODE_SHORTCUTS = {
  // Node shortcuts
  'n1': 'CLIENT-NODE',
  'n2': 'STAFF-NODE',
  'n3': 'BOOKING-NODE',
  'n4': 'CALENDAR-NODE',
  'n5': 'MEETING-NODE',
  'n6': 'COMMUNICATION-NODE',
  'n7': 'GUARDRAIL-NODE',

  // Operation shortcuts
  'book': 'BOOKING-NODE:create',
  'cancel': 'BOOKING-NODE:cancel',
  'reschedule': 'BOOKING-NODE:reschedule',
  'check': 'BOOKING-NODE:availability',

  // Integration shortcuts
  'gcal': 'CALENDAR-NODE:sync',
  'zoom': 'MEETING-NODE:create',
  'email': 'COMMUNICATION-NODE:send',

  // Admin shortcuts
  'staff': 'STAFF-NODE:manage',
  'rules': 'GUARDRAIL-NODE:validate',
  'clients': 'CLIENT-NODE:list'
} as const

export type NodeShortcut = keyof typeof NODE_SHORTCUTS

/**
 * Get node name from shortcut
 */
export function getNode(shortcut: NodeShortcut): string {
  return NODE_SHORTCUTS[shortcut]
}

/**
 * List all available shortcuts
 */
export function listShortcuts(): void {
  console.log('='.repeat(60))
  console.log('MARVA BOOKING APP - NODE SHORTCUTS')
  console.log('='.repeat(60))
  console.log('\n📍 NODE SHORTCUTS:')
  console.log('  n1 → CLIENT-NODE       (Client management)')
  console.log('  n2 → STAFF-NODE        (Provider availability)')
  console.log('  n3 → BOOKING-NODE      (Core scheduling)')
  console.log('  n4 → CALENDAR-NODE     (Google Calendar)')
  console.log('  n5 → MEETING-NODE      (Zoom integration)')
  console.log('  n6 → COMMUNICATION-NODE (Email notifications)')
  console.log('  n7 → GUARDRAIL-NODE    (Business rules)')
  console.log('\n⚡ OPERATION SHORTCUTS:')
  console.log('  book       → Create booking')
  console.log('  cancel     → Cancel booking')
  console.log('  reschedule → Reschedule booking')
  console.log('  check      → Check availability')
  console.log('\n🔗 INTEGRATION SHORTCUTS:')
  console.log('  gcal   → Google Calendar sync')
  console.log('  zoom   → Zoom meeting')
  console.log('  email  → Send notification')
  console.log('\n👤 ADMIN SHORTCUTS:')
  console.log('  staff   → Manage staff')
  console.log('  rules   → View guardrails')
  console.log('  clients → List clients')
  console.log('\n' + '='.repeat(60))
}

/**
 * Get node details from knowledge base
 */
export async function getNodeDetails(shortcut: NodeShortcut) {
  const nodeName = getNode(shortcut)
  const nodeId = nodeName.split(':')[0]

  try {
    const nodes = await import('./booking-fractal-nodes.json')
    const node = nodes.fractalNodes.find((n: any) => n.id === nodeId)

    if (node) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`NODE: ${node.id}`)
      console.log(`${'='.repeat(60)}`)
      console.log(`Name: ${node.name}`)
      console.log(`Fractal Dimension: ${node.fractalDimension}`)
      console.log(`\nResponsibilities:`)
      node.responsibilities.forEach((r: string) => console.log(`  • ${r}`))
      console.log(`\nSPHERE Capabilities:`)
      Object.entries(node.sphereCapabilities).forEach(([phase, desc]) => {
        console.log(`  ${phase.toUpperCase()}: ${desc}`)
      })
      console.log(`\nAPI Endpoints:`)
      if (node.apiEndpoints) {
        node.apiEndpoints.forEach((ep: string) => console.log(`  • ${ep}`))
      }
      console.log(`${'='.repeat(60)}\n`)
    } else {
      console.log(`Node ${nodeId} not found in knowledge base`)
    }
  } catch (error) {
    console.error('Error loading node details:', error)
  }
}

// CLI helper for development
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    listShortcuts()
  } else {
    const shortcut = args[0] as NodeShortcut
    if (shortcut in NODE_SHORTCUTS) {
      getNodeDetails(shortcut)
    } else {
      console.log(`Unknown shortcut: ${shortcut}`)
      console.log('Run without arguments to see all shortcuts')
    }
  }
}
