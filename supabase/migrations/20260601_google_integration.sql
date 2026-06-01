-- Google integrations (Calendar + Docs)
CREATE TABLE IF NOT EXISTS google_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    google_email TEXT,
    google_name TEXT,
    scope TEXT,
    is_connected BOOLEAN DEFAULT false,
    UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_google_integrations_user ON google_integrations(user_id);

ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integration"
    ON google_integrations FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
