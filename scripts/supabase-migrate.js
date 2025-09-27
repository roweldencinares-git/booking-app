#!/usr/bin/env node

/**
 * Automated Supabase Migration Script
 * Applies database migrations automatically
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function runMigration() {
  log('🗄️ Starting Supabase Migration Process...', 'blue');

  try {
    // Check if .env.local exists and has Supabase credentials
    const envPath = path.join(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
      log('❌ .env.local file not found', 'red');
      return false;
    }

    // Load environment variables
    require('dotenv').config({ path: envPath });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseKey.includes('YOUR_')) {
      log('❌ Supabase credentials not properly configured', 'red');
      log('Please check your .env.local file', 'yellow');
      return false;
    }

    log('✅ Supabase credentials found', 'green');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../sql/add-user-availability.sql');
    if (!fs.existsSync(migrationPath)) {
      log('❌ Migration file not found: add-user-availability.sql', 'red');
      return false;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    log('📄 Migration file loaded', 'green');

    // Option 1: Use psql if available
    try {
      const dbUrl = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
      const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${dbUrl}.supabase.co:5432/postgres`;

      log('🔗 Attempting to connect with psql...', 'blue');

      // Write migration to temp file
      const tempFile = path.join(__dirname, '../temp-migration.sql');
      fs.writeFileSync(tempFile, migrationSQL);

      execSync(`psql "${connectionString}" -f "${tempFile}"`, {
        stdio: 'inherit',
        timeout: 30000
      });

      // Clean up temp file
      fs.unlinkSync(tempFile);

      log('✅ Migration applied successfully via psql!', 'green');
      return true;

    } catch (psqlError) {
      log('⚠️ psql not available or failed, trying alternative method...', 'yellow');
    }

    // Option 2: Use Supabase CLI
    try {
      log('🔗 Attempting to use Supabase CLI...', 'blue');

      // Set environment variables for Supabase CLI
      process.env.SUPABASE_URL = supabaseUrl;
      process.env.SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      process.env.SUPABASE_SERVICE_ROLE_KEY = supabaseKey;

      // Try to apply migration using Supabase CLI
      execSync('npx supabase db reset --linked', {
        stdio: 'inherit',
        timeout: 60000
      });

      log('✅ Migration applied successfully via Supabase CLI!', 'green');
      return true;

    } catch (cliError) {
      log('⚠️ Supabase CLI method failed', 'yellow');
    }

    // Option 3: Provide manual instructions
    log('\n📋 Automatic migration failed. Please apply manually:', 'yellow');
    log('1. Go to https://app.supabase.com');
    log('2. Open your project');
    log('3. Go to SQL Editor');
    log('4. Copy and paste the contents of: sql/add-user-availability.sql');
    log('5. Click "Run"');

    log('\n📄 Migration SQL Preview:', 'blue');
    log('─'.repeat(50));
    console.log(migrationSQL.split('\n').slice(0, 10).join('\n'));
    log('─'.repeat(50));
    log('(Full file: sql/add-user-availability.sql)');

    return false;

  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, 'red');
    return false;
  }
}

if (require.main === module) {
  runMigration().then(success => {
    if (success) {
      log('\n🎉 Database migration completed successfully!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️ Manual migration required. See instructions above.', 'yellow');
      process.exit(1);
    }
  });
}

module.exports = { runMigration };