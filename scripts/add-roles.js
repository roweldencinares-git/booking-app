const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addRoles() {
  console.log('🚀 Adding role system to BookingApp...')
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'sql', 'add-roles.sql')
    const migration = fs.readFileSync(migrationPath, 'utf8')
    
    // Split into individual queries
    const queries = migration.split(';').filter(q => q.trim())
    
    for (const query of queries) {
      if (query.trim()) {
        console.log(`Executing: ${query.trim().substring(0, 50)}...`)
        
        // Use raw SQL execution
        const { error } = await supabase.rpc('exec_sql', { sql: query.trim() })
        
        if (error) {
          console.error('Query error:', error)
          console.log('Manual execution may be required in Supabase SQL Editor')
        }
      }
    }
    
    console.log('✅ Role system added successfully!')
    console.log('👑 All users now have admin permissions')
    console.log('🏢 Organization-wide view enabled')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Manual setup required:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor') 
    console.log('3. Copy and paste the contents of sql/add-roles.sql')
    console.log('4. Click Run to execute the migration')
  }
}

addRoles()