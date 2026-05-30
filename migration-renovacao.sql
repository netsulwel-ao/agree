-- Renovação de planos: tipo de pedido (novo / renovação)

ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'new' CHECK (type IN ('new', 'renewal'));

-- Períodos de subscrição
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
