-- External signature providers (DocuSign, HelloSign, etc.) and requests

CREATE TABLE IF NOT EXISTS signature_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS signature_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES signature_providers(id) ON DELETE SET NULL,
    provider_request_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','sent','viewed','signed','declined','error','voided')),
    signers JSONB DEFAULT '[]'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    envelope_url TEXT,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sigreq_contract ON signature_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_sigreq_provider ON signature_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_sigreq_status ON signature_requests(status);

ALTER TABLE signature_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read providers"
    ON signature_providers FOR SELECT USING (true);

CREATE POLICY "Admins can manage providers"
    ON signature_providers FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

CREATE POLICY "Users can read own requests"
    ON signature_requests FOR SELECT
    USING (created_by = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

CREATE POLICY "Users can create requests"
    ON signature_requests FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update requests"
    ON signature_requests FOR UPDATE
    USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Seed default provider entries
INSERT INTO signature_providers (name, label, sort_order, config) VALUES
    ('docusign', 'DocuSign', 1, '{"base_url":"https://demo.docusign.net/restapi"}'),
    ('hellosign', 'HelloSign (Dropbox Sign)', 2, '{"base_url":"https://api.hellosign.com/v3"}'),
    ('signnow', 'SignNow', 3, '{"base_url":"https://api.signnow.com"}')
ON CONFLICT (name) DO NOTHING;
