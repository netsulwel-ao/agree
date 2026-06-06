-- Currency support: exchange rates table
-- currency column já existe em contracts (core_tables.sql)

CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC NOT NULL,
    source TEXT DEFAULT 'manual',
    UNIQUE (from_currency, to_currency)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_from ON exchange_rates(from_currency);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exchange rates"
    ON exchange_rates FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage exchange rates"
    ON exchange_rates FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Seed some default rates
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
    ('AOA', 'USD', 0.0011),
    ('USD', 'AOA', 909.09),
    ('AOA', 'EUR', 0.0010),
    ('EUR', 'AOA', 1000.00),
    ('USD', 'EUR', 0.92),
    ('EUR', 'USD', 1.09)
ON CONFLICT (from_currency, to_currency) DO NOTHING;
