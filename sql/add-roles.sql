-- Add role column to users table
ALTER TABLE users ADD COLUMN role text DEFAULT 'admin' CHECK (role IN ('admin', 'staff'));

-- Update existing users to admin
UPDATE users SET role = 'admin' WHERE role IS NULL;