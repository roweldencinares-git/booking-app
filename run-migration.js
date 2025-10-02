const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fedrcezunboposdjsoqp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZHJjZXp1bmJvcG9zZGpzb3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjYzOTkxMiwiZXhwIjoyMDcyMjE1OTEyfQ.GA408M83VgzBxD6F3lLatPRu6cBPmQs3NqMtd2cCCME'
)

async function runMigration() {
  try {
    // Check if column exists
    const { data: columns, error: checkError } = await supabase
      .from('users')
      .select('google_connected_at')
      .limit(1)

    if (checkError && checkError.message.includes('column')) {
      console.log('Column does not exist, needs to be added manually via SQL')
      console.log('Please run this SQL in Supabase dashboard:')
      console.log('ALTER TABLE users ADD COLUMN google_connected_at TIMESTAMPTZ;')
      console.log('UPDATE users SET google_connected_at = NOW() WHERE google_calendar_connected = true AND google_connected_at IS NULL;')
      process.exit(1)
    }

    // Update existing connections
    const { data, error } = await supabase
      .from('users')
      .update({ google_connected_at: new Date().toISOString() })
      .eq('google_calendar_connected', true)
      .is('google_connected_at', null)

    if (error) {
      console.error('Error updating users:', error)
    } else {
      console.log('✅ Migration completed successfully')
      console.log('Updated existing Google Calendar connections with current timestamp')
    }
  } catch (err) {
    console.error('Migration error:', err)
  }
}

runMigration()
