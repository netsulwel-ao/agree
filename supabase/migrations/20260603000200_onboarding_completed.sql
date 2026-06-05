-- Persiste o estado do onboarding na base de dados
-- em vez de localStorage, para que seja consistente entre dispositivos.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
