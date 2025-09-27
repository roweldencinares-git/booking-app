-- Create user_integrations table for third-party service integrations
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'zoom', 'google', 'teams', etc.
    external_id VARCHAR(255), -- External user ID from the provider
    access_token TEXT NOT NULL, -- OAuth access token
    refresh_token TEXT, -- OAuth refresh token
    expires_at TIMESTAMP WITH TIME ZONE, -- When the token expires
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}', -- Additional provider-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider) -- One integration per provider per user
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_provider ON user_integrations(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_user_integrations_active ON user_integrations(is_active) WHERE is_active = true;

-- Add RLS (Row Level Security) policy
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own integrations
CREATE POLICY "Users can manage their own integrations" ON user_integrations
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Service role can access all integrations
CREATE POLICY "Service role can access all integrations" ON user_integrations
    FOR ALL USING (auth.role() = 'service_role');