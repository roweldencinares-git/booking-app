-- Add Google Calendar integration columns to users table
-- Run this in your Supabase SQL editor

ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_calendar_connected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS google_access_token text,
ADD COLUMN IF NOT EXISTS google_refresh_token text,
ADD COLUMN IF NOT EXISTS google_token_expires_at timestamptz;

-- Add an index for quick lookups of connected calendars
CREATE INDEX IF NOT EXISTS idx_users_google_calendar_connected
ON users(google_calendar_connected)
WHERE google_calendar_connected = true;