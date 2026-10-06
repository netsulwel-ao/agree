-- ══════════════════════════════════════════════════════════════════════
-- Sistema de webhooks para notificar aplicações externas
--
-- Quando um contrato muda de status (especialmente com contexto de
-- condomínio), o NetsulCondo precisa de saber para actualizar a sua UI.
-- ══════════════════════════════════════════════════════════════════════

-- ─── Tabela de subscrições de webhook ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Aplicação que quer receber os webhooks
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  
  -- URL onde enviar os webhooks
  webhook_url TEXT NOT NULL,
  
  -- Eventos que esta subscrição quer receber
  events TEXT[] NOT NULL DEFAULT '{}',
  
  -- Segredo para assinar os webhooks (HMAC-SHA256)
  webhook_secret TEXT NOT NULL,
  
  is_active BOOLEAN DEFAULT true,
  
  -- Estatísticas de entrega
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_client ON webhook_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_active ON webhook_subscriptions(is_active);

-- ─── Tabela de entregas de webhook ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  
  -- Evento que disparou o webhook
  event_type TEXT NOT NULL,
  
  -- Payload enviado (JSON)
  payload JSONB NOT NULL,
  
  -- Resposta do endpoint
  status_code INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  
  -- Estado da entrega
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  
  -- Para retry automático
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_subscription ON webhook_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'failed';

-- ─── Função para enviar webhook ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_webhook_contract_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  subscription_record webhook_subscriptions%ROWTYPE;
  payload_json JSONB;
  event_name TEXT;
  delivery_id UUID;
BEGIN
  -- Determina o tipo de evento baseado na operação
  IF TG_OP = 'INSERT' THEN
    event_name := 'contract.created';
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    CASE NEW.status
      WHEN 'pending' THEN event_name := 'contract.sent';
      WHEN 'approved' THEN event_name := 'contract.signed';
      WHEN 'rejected' THEN event_name := 'contract.rejected';
      ELSE event_name := 'contract.updated';
    END CASE;
  ELSE
    -- Não é uma mudança relevante
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Só notifica contratos com contexto de condomínio
  IF COALESCE(NEW.condominio_id, OLD.condominio_id) IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Constrói o payload
  payload_json := jsonb_build_object(
    'event', event_name,
    'contract', jsonb_build_object(
      'id', COALESCE(NEW.id, OLD.id),
      'title', COALESCE(NEW.title, OLD.title),
      'status', COALESCE(NEW.status, OLD.status),
      'value', COALESCE(NEW.value, OLD.value),
      'currency', COALESCE(NEW.currency, OLD.currency),
      'start_date', COALESCE(NEW.start_date, OLD.start_date),
      'end_date', COALESCE(NEW.end_date, OLD.end_date),
      'client_id', COALESCE(NEW.client_id, OLD.client_id),
      'condominio_id', COALESCE(NEW.condominio_id, OLD.condominio_id),
      'condominio_name', COALESCE(NEW.condominio_name, OLD.condominio_name),
      'unit_label', COALESCE(NEW.unit_label, OLD.unit_label),
      'party_type', COALESCE(NEW.party_type, OLD.party_type),
      -- Signatário que assinou: pega no primeiro com signed=true no JSONB
      'signer_name', (
        SELECT s->>'name'
        FROM jsonb_array_elements(
          COALESCE(NEW.signatures, OLD.signatures, '[]'::jsonb)
        ) AS s
        WHERE (s->>'signed')::boolean = true
        LIMIT 1
      ),
      'signer_email', (
        SELECT s->>'email'
        FROM jsonb_array_elements(
          COALESCE(NEW.signatures, OLD.signatures, '[]'::jsonb)
        ) AS s
        WHERE (s->>'signed')::boolean = true
        LIMIT 1
      )
    ),
    'company_id', COALESCE(NEW.netsulcondo_company_id, OLD.netsulcondo_company_id),
    'timestamp', NOW()
  );

  -- Encontra todas as subscrições activas que querem este evento
  FOR subscription_record IN
    SELECT * FROM webhook_subscriptions 
    WHERE is_active = true 
    AND event_name = ANY(events)
    AND client_id LIKE 'netsulcondo%' -- Só notifica o NetsulCondo por agora
  LOOP
    -- Cria uma entrada de entrega pendente
    INSERT INTO webhook_deliveries (
      subscription_id,
      event_type,
      payload,
      status
    ) VALUES (
      subscription_record.id,
      event_name,
      payload_json,
      'pending'
    ) RETURNING id INTO delivery_id;

    -- Envia o webhook via pg_net (se disponível) ou agenda para processamento
    BEGIN
      PERFORM net.http_post(
        url := subscription_record.webhook_url,
        body := payload_json::text,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'User-Agent', 'Agree-Webhooks/1.0',
          'X-Webhook-Event', event_name,
          'X-Webhook-Signature', 'sha256=' || encode(
            hmac(payload_json::text, subscription_record.webhook_secret, 'sha256'), 
            'hex'
          )
        )::jsonb
      );
      
      -- Marca como sucesso se não houve erro
      UPDATE webhook_deliveries 
      SET status = 'success', delivered_at = NOW(), attempts = 1
      WHERE id = delivery_id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Marca como falhado para retry posterior
      UPDATE webhook_deliveries 
      SET status = 'failed', attempts = 1, next_retry_at = NOW() + INTERVAL '5 minutes'
      WHERE id = delivery_id;
    END;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ─── Trigger para contratos ─────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trigger_webhook_contract_change ON contracts;
CREATE TRIGGER trigger_webhook_contract_change
  AFTER INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION notify_webhook_contract_change();

-- ─── Função de limpeza de entregas antigas ──────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_old_webhook_deliveries()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM webhook_deliveries
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND status IN ('success', 'failed');
END;
$$;

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Só aplicações OAuth podem gerir as suas próprias subscrições
-- (implementação futura via Edge Function)