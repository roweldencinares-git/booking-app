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

async function addSampleData() {
  console.log('🚀 Adding sample data to BookingApp...')

  try {
    // First, create a sample user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    let userId
    if (!users || users.length === 0) {
      console.log('Creating sample user...')
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          clerk_user_id: 'sample_user_123',
          email: 'admin@bookingapp.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin'
        })
        .select()
        .single()

      if (createUserError) {
        console.error('Error creating user:', createUserError)
        return
      }
      userId = newUser.id
    } else {
      userId = users[0].id
      console.log('Using existing user:', users[0].email)
    }

    // Create sample booking types
    const bookingTypes = [
      {
        user_id: userId,
        name: '30 Minute Consultation',
        duration: 30,
        description: 'Quick consultation call to discuss your needs',
        price: 50,
        slug: 'consultation30',
        is_active: true
      },
      {
        user_id: userId,
        name: '1 Hour Coaching Session',
        duration: 60,
        description: 'Full coaching session with detailed planning',
        price: 100,
        slug: 'coaching60',
        is_active: true
      },
      {
        user_id: userId,
        name: 'Free Discovery Call',
        duration: 15,
        description: 'Complimentary call to see if we are a good fit',
        price: 0,
        slug: 'discovery15',
        is_active: true
      },
      {
        user_id: userId,
        name: 'Darren 30min Session',
        duration: 30,
        description: 'Personal 30-minute session with Darren',
        price: 75,
        slug: 'darren30',
        is_active: true
      }
    ]

    // Check if booking types already exist
    const { data: existingTypes } = await supabase
      .from('booking_types')
      .select('*')
      .eq('user_id', userId)

    if (!existingTypes || existingTypes.length === 0) {
      console.log('Creating booking types...')
      const { data: createdTypes, error: typesError } = await supabase
        .from('booking_types')
        .insert(bookingTypes)
        .select()

      if (typesError) {
        console.error('Error creating booking types:', typesError)
        return
      }

      console.log('✅ Sample data added successfully!')
      console.log(`📅 Created ${createdTypes.length} booking types`)
    } else {
      console.log('✅ Booking types already exist!')
      console.log(`📅 Found ${existingTypes.length} existing booking types`)
    }

    console.log('🎯 Services now available at /book')

  } catch (error) {
    console.error('❌ Failed to add sample data:', error.message)
  }
}

addSampleData()