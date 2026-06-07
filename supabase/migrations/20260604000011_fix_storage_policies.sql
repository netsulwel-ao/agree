-- ============================================
-- Fix user_signatures table schema
-- ============================================

-- Check if user_signatures table has the correct columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_signatures' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE user_signatures ADD COLUMN image_url TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_signatures' AND column_name = 'encrypted_data'
    ) THEN
        ALTER TABLE user_signatures ADD COLUMN encrypted_data TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_signatures' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE user_signatures ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;
