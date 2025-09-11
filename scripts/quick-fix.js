// Quick test to see what's in the database
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDatabase() {
  console.log('🔍 Testing database...')
  
  // Check if users table exists and what columns it has
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Users table data:', data)
  }
  
  // Try to create a simple user without role
  const { data: testUser, error: testError } = await supabase
    .from('users')
    .insert([{
      clerk_user_id: `test_${Date.now()}`,
      first_name: 'Rowel',
      last_name: 'Test',
      email: `test${Date.now()}@example.com`
    }])
    .select()
    .single()
  
  if (testError) {
    console.error('Test insert error:', testError)
  } else {
    console.log('Test user created:', testUser)
  }
}

testDatabase()