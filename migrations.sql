-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    value NUMERIC,
    status TEXT DEFAULT 'draft',
    owner_id UUID NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    risks JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    version TEXT DEFAULT '1.0',
    risk_level TEXT DEFAULT 'low',
    signatures JSONB DEFAULT '[]'::jsonb
);

-- Create contract_versions table
CREATE TABLE IF NOT EXISTS contract_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    content TEXT,
    version_number NUMERIC DEFAULT 1
);

-- Create meeting_notes table
CREATE TABLE IF NOT EXISTS meeting_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    date DATE,
    participants TEXT,
    content TEXT,
    author_id UUID,
    author_name TEXT
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user'
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    user_name TEXT,
    action TEXT,
    resource TEXT,
    status TEXT DEFAULT 'success'
);

-- Enable Row Level Security (RLS)
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for contracts
CREATE POLICY "Users can view their own contracts"
    ON contracts FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own contracts"
    ON contracts FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own contracts"
    ON contracts FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own contracts"
    ON contracts FOR DELETE
    USING (auth.uid() = owner_id);

-- Create policies for contract_versions
CREATE POLICY "Users can view their own contract versions"
    ON contract_versions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM contracts c WHERE c.id = contract_versions.contract_id AND c.owner_id = auth.uid()
    ));

CREATE POLICY "Users can create their own contract versions"
    ON contract_versions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM contracts c WHERE c.id = contract_versions.contract_id AND c.owner_id = auth.uid()
    ));

-- Create policies for meeting_notes
CREATE POLICY "Users can view meeting notes for their contracts"
    ON meeting_notes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM contracts c WHERE c.id = meeting_notes.contract_id AND c.owner_id = auth.uid()
    ));

CREATE POLICY "Users can create meeting notes for their contracts"
    ON meeting_notes FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM contracts c WHERE c.id = meeting_notes.contract_id AND c.owner_id = auth.uid()
    ));

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create policy for audit_logs (allow insert for authenticated users)
CREATE POLICY "Users can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create profile on new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
