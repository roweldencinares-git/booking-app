-- Add slug field to booking_types table for personalized URLs
ALTER TABLE booking_types ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_booking_types_slug ON booking_types(slug);

-- Update existing booking types with sample slugs
UPDATE booking_types SET slug = 'coaching60' WHERE name = '1 Hour Coaching Session' AND slug IS NULL;
UPDATE booking_types SET slug = 'consultation30' WHERE name = '30 Minute Consultation' AND slug IS NULL;
UPDATE booking_types SET slug = 'discovery15' WHERE name = 'Free Discovery Call' AND slug IS NULL;
UPDATE booking_types SET slug = 'darren30' WHERE name = '5' AND slug IS NULL;