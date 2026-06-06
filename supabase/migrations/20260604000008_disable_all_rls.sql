-- ============================================
-- Disable RLS on all tables
-- ============================================

-- Disable RLS on all tables (skip if table doesn't exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contracts') THEN
        ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
        ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tags') THEN
        ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_keys') THEN
        ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'approval_workflows') THEN
        ALTER TABLE approval_workflows DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
        ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
        ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'signature_providers') THEN
        ALTER TABLE signature_providers DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'templates') THEN
        ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
        ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'renewals') THEN
        ALTER TABLE renewals DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_signatures') THEN
        ALTER TABLE user_signatures DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;
