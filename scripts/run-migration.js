// Run SQL migration for user_integrations table
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Read SQL file
  const sqlPath = path.join(__dirname, '..', 'sql', 'add-user-integrations.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  console.log('Running migration...')
  console.log('SQL:', sql)

  // Note: Supabase client doesn't support raw SQL
  // You need to run this in Supabase SQL Editor or use the REST API
  console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:')
  console.log('👉 https://supabase.com/dashboard/project/fedrcezunboposdjsoqp/sql/new')
  console.log('\n' + sql)

  // Check if table exists
  const { data, error } = await supabase
    .from('user_integrations')
    .select('count')
    .limit(1)

  if (error) {
    console.error('\n❌ Table does not exist. Run the SQL above in Supabase.')
    console.error('Error:', error.message)
  } else {
    console.log('\n✅ Table exists!')
  }
}

runMigration()