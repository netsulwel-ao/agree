-- tags column já existe em contracts (core_tables.sql)
-- Create an index for tag search
CREATE INDEX IF NOT EXISTS idx_contracts_tags ON contracts USING GIN (tags);
