create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'manual',
  external_id text,
  title text not null,
  source text not null,
  category text not null check (
    category in ('GitHub', 'AI Tools', 'Models', 'Design', 'Dev Tools')
  ),
  url text not null,
  summary text not null,
  why_it_matters text not null,
  stars integer,
  growth integer,
  score integer not null default 0,
  tags text[] not null default '{}',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.signals add column if not exists provider text not null default 'manual';
alter table public.signals add column if not exists external_id text;

create unique index if not exists signals_provider_external_id_idx
  on public.signals (provider, external_id)
  where external_id is not null;

create index if not exists signals_score_idx on public.signals (score desc);
create index if not exists signals_published_at_idx on public.signals (published_at desc);
create index if not exists signals_category_idx on public.signals (category);
