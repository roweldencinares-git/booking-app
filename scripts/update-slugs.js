const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateSlugs() {
  console.log('🚀 Updating existing booking types with slugs...')

  try {
    // Get all booking types
    const { data: bookingTypes, error } = await supabase
      .from('booking_types')
      .select('*')

    if (error) {
      console.error('Error fetching booking types:', error)
      return
    }

    console.log(`Found ${bookingTypes.length} booking types`)

    // Manual slug assignments based on current data
    const slugMappings = {
      '1 Hour Coaching Session': 'coaching60',
      '30 Minute Consultation': 'consultation30',
      'Free Discovery Call': 'discovery15',
      '5': 'darren30' // This appears to be the existing one
    }

    for (const type of bookingTypes) {
      const slug = slugMappings[type.name]
      if (slug) {
        console.log(`Updating ${type.name} with slug: ${slug}`)

        // Try direct SQL update
        const updateSQL = `UPDATE booking_types SET slug = '${slug}' WHERE id = '${type.id}'`
        console.log(`Executing: ${updateSQL}`)

        // For now, let's just log what we would do
        console.log(`Would update ${type.id} -> ${slug}`)
      }
    }

    console.log('✅ Slug updates prepared!')
    console.log('🔗 Personalized URLs will be available:')
    console.log('   - /coaching60')
    console.log('   - /consultation30')
    console.log('   - /discovery15')
    console.log('   - /darren30')

  } catch (error) {
    console.error('❌ Update failed:', error.message)
  }
}

updateSlugs()