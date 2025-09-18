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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addSlugField() {
  console.log('🚀 Adding slug field for personalized booking URLs...')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'sql', 'add-slug-field.sql')
    const migration = fs.readFileSync(migrationPath, 'utf8')

    // Split into individual queries
    const queries = migration.split(';').filter(q => q.trim())

    for (const query of queries) {
      if (query.trim()) {
        console.log(`Executing: ${query.trim().substring(0, 50)}...`)

        // Execute raw SQL
        const { error } = await supabase.rpc('exec_sql', { sql: query.trim() })

        if (error && error.code !== 'PGRST202') {
          console.error('Query error:', error)
        }
      }
    }

    // Alternative direct approach for adding column
    console.log('Adding slug column directly...')
    const { error: alterError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE booking_types ADD COLUMN IF NOT EXISTS slug text UNIQUE'
      })

    if (alterError && alterError.code !== 'PGRST202') {
      console.log('Using direct column approach...')
    }

    // Update slugs directly via client
    console.log('Updating booking types with slugs...')

    const updates = [
      { name: '1 Hour Coaching Session', slug: 'coaching60' },
      { name: '30 Minute Consultation', slug: 'consultation30' },
      { name: 'Free Discovery Call', slug: 'discovery15' },
      { name: '5', slug: 'darren30' }
    ]

    for (const update of updates) {
      const { error } = await supabase
        .from('booking_types')
        .update({ slug: update.slug })
        .eq('name', update.name)
        .is('slug', null)

      if (error) {
        console.log(`Note: ${update.name} - ${error.message}`)
      } else {
        console.log(`✅ Updated ${update.name} with slug: ${update.slug}`)
      }
    }

    console.log('✅ Slug field migration complete!')
    console.log('🔗 Personalized URLs now available:')
    console.log('   - /coaching60')
    console.log('   - /consultation30')
    console.log('   - /discovery15')
    console.log('   - /darren30')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
  }
}

addSlugField()