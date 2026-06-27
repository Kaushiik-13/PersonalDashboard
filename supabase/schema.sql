create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'manual',
  external_id text,
  title text not null,
  source text not null,
  category text not null check (
    category in ('AI Tools', 'Models', 'Infrastructure', 'Design', 'Dev Tools', 'Tech Blogs', 'Bookmark')
  ),
  url text not null,
  summary text not null,
  why_it_matters text not null,
  stars integer,
  growth integer,
  score integer not null default 0,
  tags text[] not null default '{}',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  is_saved boolean not null default false,
  is_hidden boolean not null default false,
  last_seen_at timestamptz not null default now(),
  previous_score integer,
  previous_stars integer,
  previous_rank integer,
  first_seen_at timestamptz,
  rank_change integer not null default 0,
  star_delta integer not null default 0,
  score_delta integer not null default 0,
  read_status text not null default 'unread'
);

drop index if exists signals_provider_external_id_idx;

create unique index if not exists signals_provider_external_id_idx
  on public.signals (provider, external_id);

create index if not exists signals_score_idx on public.signals (score desc);
create index if not exists signals_published_at_idx on public.signals (published_at desc);
create index if not exists signals_category_idx on public.signals (category);
create index if not exists signals_last_seen_at_idx on public.signals (last_seen_at desc);
create index if not exists signals_is_saved_idx on public.signals (is_saved);
create index if not exists signals_rank_change_idx on public.signals (rank_change desc);
create index if not exists signals_first_seen_at_idx on public.signals (first_seen_at desc);
create index if not exists signals_read_status_idx on public.signals (read_status);

create table if not exists public.pipeline_status (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled',
  blocks jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_updated_at_idx on public.notes (updated_at desc);
create index if not exists notes_is_pinned_idx on public.notes (is_pinned);
create index if not exists notes_is_archived_idx on public.notes (is_archived);
create index if not exists notes_tags_idx on public.notes using gin (tags);
