-- ============================================
-- Add missing name column to user_signatures
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_signatures' AND column_name = 'name'
    ) THEN
        ALTER TABLE user_signatures ADD COLUMN name TEXT;
    END IF;
END $$;
