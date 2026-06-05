-- ============================================
-- Facturação Associada — ligar contratos a facturas
-- ============================================

-- Sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Invoice table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    number TEXT NOT NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    value NUMERIC NOT NULL DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    tax_value NUMERIC DEFAULT 0,
    total_value NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
    issued_date DATE,
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    line_items JSONB DEFAULT '[]'::jsonb,
    currency TEXT DEFAULT 'AOA',
    payment_terms TEXT,
    paid_via TEXT,
    notification_sent BOOLEAN DEFAULT false,
    UNIQUE (number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_contract ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_owner ON invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_year TEXT := to_char(NOW(), 'YYYY');
    v_seq INTEGER;
    v_number TEXT;
BEGIN
    v_seq := nextval('invoice_number_seq');
    v_number := 'FAT-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
    RETURN v_number;
END;
$$;

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
    ON invoices FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all invoices"
    ON invoices FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Users can create invoices"
    ON invoices FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own invoices"
    ON invoices FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own invoices"
    ON invoices FOR DELETE
    USING (owner_id = auth.uid());
