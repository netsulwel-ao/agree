-- Add tags array column to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create an index for tag search
CREATE INDEX IF NOT EXISTS idx_contracts_tags ON contracts USING GIN (tags);
