#!/usr/bin/env node

// Environment variable validation script
// This ensures all required environment variables are properly loaded

const requiredEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

console.log('🔍 Checking environment variables...')

let missingVars = []
let presentVars = []

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    presentVars.push(varName)
    console.log(`✅ ${varName}: ${process.env[varName].substring(0, 10)}...`)
  } else {
    missingVars.push(varName)
    console.log(`❌ ${varName}: NOT FOUND`)
  }
})

console.log(`\n📊 Summary:`)
console.log(`✅ Present: ${presentVars.length}/${requiredEnvVars.length}`)
console.log(`❌ Missing: ${missingVars.length}/${requiredEnvVars.length}`)

if (missingVars.length > 0) {
  console.log(`\n🚨 Missing required environment variables:`)
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`)
  })
  process.exit(1)
} else {
  console.log(`\n🎉 All required environment variables are present!`)
  process.exit(0)
}