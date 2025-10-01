-- Add google_connected_at column to track when Google Calendar was initially connected
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_connected_at TIMESTAMPTZ;

-- Set google_connected_at for existing connections to current time
UPDATE users
SET google_connected_at = NOW()
WHERE google_calendar_connected = true
  AND google_connected_at IS NULL;
