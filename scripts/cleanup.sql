-- Limpa todos os dados excepto admin
DO $$
DECLARE
  admin_id TEXT;
  tbl TEXT;
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE NOTICE 'Nenhum admin encontrado. Nada foi apagado.';
    RETURN;
  END IF;

  RAISE NOTICE 'Admin encontrado: %', admin_id;

  FOR tbl IN
    SELECT unnest(ARRAY[
      'payment_requests', 'reminders', 'renewal_history', 'notifications', 'audit_logs',
      'contracts', 'clients', 'invoices', 'api_keys', 'google_integrations',
      'signature_requests', 'approval_requests', 'approval_request_approvals',
      'contract_templates',
      'profiles'
    ])
  LOOP
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      CONTINUE;
    END IF;

    IF tbl = 'profiles' THEN
      EXECUTE format('DELETE FROM %I WHERE id != %L AND (role IS NULL OR role != ''admin'')', tbl, admin_id);
      RAISE NOTICE '  profiles: ok';
      CONTINUE;
    END IF;

    -- Tenta apagar comparando colunas como texto (genérico, evita erros de tipo)
    BEGIN
      IF tbl IN ('payment_requests', 'reminders', 'notifications', 'audit_logs') THEN
        EXECUTE format('DELETE FROM %I WHERE user_id::text != %L', tbl, admin_id);
      ELSIF tbl = 'renewal_history' THEN
        EXECUTE format('DELETE FROM %I WHERE created_by::text != %L', tbl, admin_id);
      ELSIF tbl = 'contract_templates' THEN
        EXECUTE format('DELETE FROM %I WHERE created_by IS NOT NULL AND created_by::text != %L', tbl, admin_id);
      ELSIF tbl IN ('contracts', 'clients', 'invoices') THEN
        EXECUTE format('DELETE FROM %I WHERE owner_id::text != %L', tbl, admin_id);
      ELSIF tbl IN ('api_keys', 'google_integrations') THEN
        EXECUTE format('DELETE FROM %I WHERE user_id::text != %L', tbl, admin_id);
      ELSIF tbl IN ('signature_requests', 'approval_requests') THEN
        EXECUTE format('DELETE FROM %I WHERE created_by::text != %L', tbl, admin_id);
      ELSIF tbl IN ('approval_request_approvals') THEN
        EXECUTE format('DELETE FROM %I', tbl);
      ELSE
        EXECUTE format('DELETE FROM %I', tbl);
      END IF;
      RAISE NOTICE '  %: ok', tbl;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '  %: erro inesperado — %', tbl, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Limpeza concluída. Apenas o admin e os seus dados foram mantidos.';
END $$;
