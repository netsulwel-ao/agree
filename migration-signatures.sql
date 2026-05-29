-- Create storage bucket for signature images
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'Usuários autenticados podem enviar signatures') THEN
    CREATE POLICY "Usuários autenticados podem enviar signatures" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'signatures' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'Anon pode enviar para sessions') THEN
    CREATE POLICY "Anon pode enviar para sessions" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'signatures' AND name LIKE 'sessions/%');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'Qualquer um pode ler signatures') THEN
    CREATE POLICY "Qualquer um pode ler signatures" ON storage.objects FOR SELECT
      USING (bucket_id = 'signatures');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'Usuários podem atualizar signatures') THEN
    CREATE POLICY "Usuários podem atualizar signatures" ON storage.objects FOR UPDATE
      USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'Usuários podem eliminar signatures') THEN
    CREATE POLICY "Usuários podem eliminar signatures" ON storage.objects FOR DELETE
      USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Create user_signatures table for storing registered digital signatures
CREATE TABLE IF NOT EXISTS user_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT,
    encrypted_data TEXT,
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE user_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own signatures"
    ON user_signatures FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signatures"
    ON user_signatures FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signatures"
    ON user_signatures FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signatures"
    ON user_signatures FOR DELETE
    USING (auth.uid() = user_id);

-- Insert into audit_logs when signatures are modified
CREATE OR REPLACE FUNCTION public.handle_signature_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, user_name, action, resource, status)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        (SELECT name FROM public.profiles WHERE id = COALESCE(NEW.user_id, OLD.user_id)),
        CASE
            WHEN TG_OP = 'INSERT' THEN 'create_signature'
            WHEN TG_OP = 'UPDATE' THEN 'update_signature'
            WHEN TG_OP = 'DELETE' THEN 'delete_signature'
        END,
        'user_signature',
        'success'
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_signature_audit
    AFTER INSERT OR UPDATE OR DELETE ON user_signatures
    FOR EACH ROW EXECUTE FUNCTION public.handle_signature_audit();
