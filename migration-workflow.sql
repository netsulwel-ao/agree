-- Workflow de aprovação: rejection_reason, reviewed_by, reviewed_at
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
