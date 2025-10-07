/**
 * Coach Dashboard Service - SPHERE Integrated
 *
 * Following SPHERE pattern for all operations:
 * S - SCAN + HYPOTHESIZE
 * P - PLAN + TEST
 * H - HEAL
 * E - EXAMINE + VALIDATE
 * R - REINFORCE
 * E - EVOLVE
 */

export interface Client {
  id: string
  name: string
  email: string
  lastSessionDate: string | null
  totalSessions: number
  status: 'active' | 'inactive'
}

export interface DashboardData {
  coachName: string
  clients: Client[]
  insights: string[]
}

/**
 * Load coach dashboard data with SPHERE methodology
 */
export async function loadCoachDashboard(
  coachId: string,
  coachName: string
): Promise<DashboardData> {
  try {
    // S - SCAN: Validate inputs and check preconditions
    if (!coachId || !coachName) {
      throw new Error('Coach ID and name are required')
    }

    // P - PLAN: Determine data fetching strategy
    // For MVP: Using mock data
    // Future: Query Supabase for actual client-booking relationships
    const mockClients: Client[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        lastSessionDate: '2025-10-05',
        totalSessions: 12,
        status: 'active'
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'mchen@example.com',
        lastSessionDate: '2025-10-03',
        totalSessions: 8,
        status: 'active'
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        email: 'emily.r@example.com',
        lastSessionDate: '2025-09-28',
        totalSessions: 15,
        status: 'active'
      },
      {
        id: '4',
        name: 'James Wilson',
        email: 'jwilson@example.com',
        lastSessionDate: '2025-09-15',
        totalSessions: 5,
        status: 'inactive'
      },
      {
        id: '5',
        name: 'Lisa Thompson',
        email: 'lisa.t@example.com',
        lastSessionDate: null,
        totalSessions: 0,
        status: 'active'
      }
    ]

    // H - HEAL: Handle missing or incomplete data
    const healedClients = mockClients.map(client => ({
      ...client,
      lastSessionDate: client.lastSessionDate || null,
      totalSessions: client.totalSessions || 0,
      status: client.status || 'active'
    }))

    // E - EXAMINE: Validate data quality
    const validClients = healedClients.filter(client => {
      const hasValidId = client.id && client.id.length > 0
      const hasValidName = client.name && client.name.length > 0
      const hasValidEmail = client.email && client.email.includes('@')
      return hasValidId && hasValidName && hasValidEmail
    })

    // R - REINFORCE: Generate insights and recommendations
    const insights = generateInsights(validClients)

    // E - EVOLVE: Return comprehensive data with actionable insights
    return {
      coachName,
      clients: validClients,
      insights
    }

  } catch (error) {
    // H - HEAL: Graceful error handling with fallback
    console.error('Error loading coach dashboard:', error)
    return {
      coachName,
      clients: [],
      insights: ['Unable to load client data. Please try again.']
    }
  }
}

/**
 * Get client notes with SPHERE methodology
 */
export async function getClientNotes(clientId: string): Promise<string[]> {
  try {
    // S - SCAN: Validate input
    if (!clientId) {
      throw new Error('Client ID is required')
    }

    // P - PLAN: Determine note retrieval strategy
    // For MVP: Return mock notes
    // Future: Query Supabase notes table
    const mockNotes: Record<string, string[]> = {
      '1': [
        'Initial goal: Improve work-life balance',
        'Progress: Successfully implemented daily meditation routine',
        'Next session: Focus on time management strategies'
      ],
      '2': [
        'Career transition coaching',
        'Exploring opportunities in tech leadership',
        'Action items: Update LinkedIn, network with 3 contacts'
      ],
      '3': [
        'Long-term client - excellent progress',
        'Recently promoted to senior manager',
        'Focus: Team leadership and delegation skills'
      ],
      '4': [
        'On hold - client requested pause',
        'Last session focused on personal challenges',
        'Follow-up scheduled for next month'
      ],
      '5': [
        'New client - intake session completed',
        'Goals: Career clarity and confidence building',
        'Schedule: Bi-weekly sessions starting next week'
      ]
    }

    // H - HEAL: Provide default if notes don't exist
    const notes = mockNotes[clientId] || ['No notes available for this client.']

    // E - EXAMINE: Validate notes quality
    const validNotes = notes.filter(note => note && note.length > 0)

    // R - REINFORCE: Log access for analytics
    console.log(`Notes accessed for client ${clientId}`)

    // E - EVOLVE: Return structured notes
    return validNotes

  } catch (error) {
    // H - HEAL: Graceful error handling
    console.error('Error loading client notes:', error)
    return ['Unable to load notes. Please try again.']
  }
}

/**
 * Generate insights based on client data (SPHERE - Evolve step)
 */
function generateInsights(clients: Client[]): string[] {
  const insights: string[] = []

  // Check for inactive clients
  const inactiveClients = clients.filter(c => c.status === 'inactive')
  if (inactiveClients.length > 0) {
    insights.push(`${inactiveClients.length} client(s) may need follow-up`)
  }

  // Check for clients without sessions
  const noSessionClients = clients.filter(c => !c.lastSessionDate)
  if (noSessionClients.length > 0) {
    insights.push(`${noSessionClients.length} new client(s) pending first session`)
  }

  // Check for recent activity
  const recentClients = clients.filter(c => {
    if (!c.lastSessionDate) return false
    const daysSince = Math.floor(
      (new Date().getTime() - new Date(c.lastSessionDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSince <= 7
  })
  if (recentClients.length > 0) {
    insights.push(`${recentClients.length} client(s) had sessions this week`)
  }

  // Default insight if none generated
  if (insights.length === 0) {
    insights.push('All clients are on track')
  }

  return insights
}
