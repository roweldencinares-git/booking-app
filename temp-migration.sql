-- Create user_availability table for storing user availability schedules
CREATE TABLE IF NOT EXISTS user_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'America/New_York',
  weekly_hours jsonb NOT NULL DEFAULT '{
    "monday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "thursday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "friday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "saturday": {"enabled": false, "start": "09:00", "end": "17:00"},
    "sunday": {"enabled": false, "start": "09:00", "end": "17:00"}
  }'::jsonb,
  date_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_availability_user_id ON user_availability(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_availability_updated_at ON user_availability;
CREATE TRIGGER update_user_availability_updated_at
    BEFORE UPDATE ON user_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Example of how to query availability:
-- Get a user's availability for a specific day
-- SELECT weekly_hours->'monday' as monday_hours FROM user_availability WHERE user_id = 'user-id';

-- Get date overrides for a specific date range
-- SELECT date_overrides FROM user_availability WHERE user_id = 'user-id';

-- Comments explaining the JSON structure:
-- weekly_hours structure:
-- {
--   "monday": {"enabled": true, "start": "09:00", "end": "17:00"},
--   "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"},
--   ...
-- }

-- date_overrides structure:
-- {
--   "2024-12-25": {"available": false, "reason": "Christmas Day"},
--   "2024-12-31": {"available": true, "start": "10:00", "end": "14:00", "reason": "New Year's Eve - Limited hours"}
-- }