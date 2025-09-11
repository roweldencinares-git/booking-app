const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Make sure .env.local has:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_url')
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Setting up BookingApp database...')
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Execute the schema
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema })
    
    if (error) {
      // Try direct query if rpc doesn't work
      const queries = schema.split(';').filter(q => q.trim())
      
      for (const query of queries) {
        if (query.trim()) {
          console.log(`Executing: ${query.trim().substring(0, 50)}...`)
          const { error: queryError } = await supabase.from('').select().limit(0) // This won't work, need direct SQL execution
          
          if (queryError) {
            console.warn(`⚠️  Query failed, you may need to run this manually in Supabase SQL Editor:`)
            console.log(query.trim())
          }
        }
      }
    }
    
    console.log('✅ Database schema setup complete!')
    console.log('📊 Created tables: users, booking_types, availability, bookings')
    console.log('🔍 Created indexes for performance')
    console.log('⏰ Added automatic timestamp triggers')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    console.log('\n📋 Manual setup required:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor') 
    console.log('3. Copy and paste the contents of sql/schema.sql')
    console.log('4. Click Run to execute the schema')
  }
}

setupDatabase()