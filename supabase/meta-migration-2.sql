-- Adicionar colunas faltantes nas tabelas Meta
ALTER TABLE ad_accounts
  ADD COLUMN IF NOT EXISTS last_insights jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT NULL;

ALTER TABLE fb_connections
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT NULL;
