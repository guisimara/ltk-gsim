-- ============================================================
-- LowTicket OS — Schema Supabase
-- Execute este SQL no SQL Editor do seu projeto Supabase
-- ============================================================

-- Habilitar RLS em todas as tabelas
-- Os usuários só acessam os próprios dados

-- ============================================================
-- Tabela: product_configs
-- Configurações do produto (preço, taxas, margens)
-- ============================================================
create table if not exists public.product_configs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'Meu Produto',
  price       numeric(10,2) not null default 27.00,
  gateway_fee numeric(5,4) not null default 0.0299,
  tax_rate    numeric(5,4) not null default 0.06,
  cogs        numeric(10,2) not null default 2.00,
  margin_target numeric(5,4) not null default 0.30,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.product_configs enable row level security;

create policy "Usuário acessa apenas seus dados"
  on public.product_configs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Tabela: bumps
-- Order bumps configuráveis
-- ============================================================
create table if not exists public.bumps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  price       numeric(10,2) not null,
  take_rate   numeric(5,4) not null default 0.30,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.bumps enable row level security;

create policy "Usuário acessa apenas seus dados"
  on public.bumps
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Tabela: upsells
-- Configuração de upsell
-- ============================================================
create table if not exists public.upsells (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  price       numeric(10,2) not null,
  take_rate   numeric(5,4) not null default 0.10,
  ltv         numeric(10,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.upsells enable row level security;

create policy "Usuário acessa apenas seus dados"
  on public.upsells
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Tabela: ad_snapshots
-- Dados de anúncios importados (Meta CSV ou API)
-- Cada linha = um ad em um dia específico
-- ============================================================
create table if not exists public.ad_snapshots (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  snapshot_date   date not null,
  ad_id           text not null,
  ad_name         text not null,
  campaign_id     text,
  campaign_name   text,
  adset_id        text,
  adset_name      text,
  creative_type   text check (creative_type in ('estatico', 'video')),
  status          text check (status in ('ativo', 'pausado', 'vencedor', 'cortado')) default 'ativo',
  spend           numeric(10,2) not null default 0,
  impressions     int not null default 0,
  clicks          int not null default 0,
  lp_views        int not null default 0,
  initiations     int not null default 0,
  purchases       int not null default 0,
  revenue         numeric(10,2) not null default 0,
  source          text check (source in ('meta_csv', 'meta_api', 'kiwify_csv', 'manual')) default 'manual',
  created_at      timestamptz not null default now()
);

alter table public.ad_snapshots enable row level security;

create policy "Usuário acessa apenas seus dados"
  on public.ad_snapshots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Índice para queries por período
create index if not exists ad_snapshots_user_date
  on public.ad_snapshots (user_id, snapshot_date desc);

-- ============================================================
-- Função: updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_product_configs
  before update on public.product_configs
  for each row execute function public.set_updated_at();

create trigger set_updated_at_bumps
  before update on public.bumps
  for each row execute function public.set_updated_at();

create trigger set_updated_at_upsells
  before update on public.upsells
  for each row execute function public.set_updated_at();
