-- TrendBridge AI — initial schema
-- Run via Supabase SQL Editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type source_platform as enum (
  'tiktok', 'instagram', 'youtube', 'reddit', 'x', 'producthunt', 'hackernews', 'other'
);

create type trend_category as enum (
  'ai', 'app', 'creator', 'business', 'lifestyle', 'gadget', 'marketing', 'meme', 'other'
);

create type trend_status as enum (
  'inbox', 'analyzing', 'approved', 'rejected', 'scripted', 'editing', 'posted', 'archived'
);

create type analysis_recommendation as enum ('use', 'maybe', 'reject');

create type post_platform as enum ('instagram', 'tiktok', 'youtube', 'x', 'threads');

create type post_status as enum ('draft', 'scheduled', 'posted', 'analyzed');

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- 1. trend_items — 手入力で登録する海外トレンドのネタ
-- ---------------------------------------------------------------------------
create table trend_items (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  source_platform source_platform not null default 'other',
  source_country text,
  source_language text,
  original_title text not null,
  original_description text,
  creator_name text,
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  views_count bigint,
  likes_count bigint,
  comments_count bigint,
  shares_count bigint,
  saves_count bigint,
  category trend_category not null default 'other',
  user_memo text,
  status trend_status not null default 'inbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trend_items_updated_at
  before update on trend_items
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. trend_analyses — AI分析結果
--    total_score / recommendation はAI出力ではなくサーバー側で決定的に算出する
-- ---------------------------------------------------------------------------
create table trend_analyses (
  id uuid primary key default gen_random_uuid(),
  trend_item_id uuid not null references trend_items (id) on delete cascade,
  summary_jp text not null,
  why_viral_overseas jsonb not null default '[]'::jsonb,
  japan_market_fit text not null,
  emotional_triggers jsonb not null default '[]'::jsonb,
  target_audience jsonb not null default '[]'::jsonb,
  novelty_in_japan text not null,
  saturation_risk jsonb not null,
  series_potential jsonb not null,
  monetization_fit jsonb not null,
  copyright_risk jsonb not null,
  controversy_risk jsonb not null,
  brand_safety_notes jsonb not null default '[]'::jsonb,
  total_score integer not null check (total_score between 0 and 100),
  score_breakdown jsonb not null,
  recommendation analysis_recommendation not null,
  created_at timestamptz not null default now()
);

create index trend_analyses_trend_item_id_idx on trend_analyses (trend_item_id);

-- ---------------------------------------------------------------------------
-- 3. content_packages — 日本向け再構成コンテンツ一式
-- ---------------------------------------------------------------------------
create table content_packages (
  id uuid primary key default gen_random_uuid(),
  trend_item_id uuid not null references trend_items (id) on delete cascade,
  analysis_id uuid not null references trend_analyses (id) on delete cascade,
  main_angle text not null,
  hook_options jsonb not null default '[]'::jsonb,
  short_15s_script text not null,
  short_30s_script text not null,
  short_60s_script text not null,
  narration_text text not null,
  subtitle_text text not null,
  instagram_caption text not null,
  x_post text not null,
  carousel_slides jsonb not null default '[]'::jsonb,
  thumbnail_text_options jsonb not null default '[]'::jsonb,
  hashtags jsonb not null default '[]'::jsonb,
  visual_plan text not null,
  cta_options jsonb not null default '[]'::jsonb,
  source_attribution_text text not null,
  created_at timestamptz not null default now()
);

create index content_packages_trend_item_id_idx on content_packages (trend_item_id);
create index content_packages_analysis_id_idx on content_packages (analysis_id);

-- ---------------------------------------------------------------------------
-- 4. posts — 実際に投稿した記録(MVPでは手動投稿)
-- ---------------------------------------------------------------------------
create table posts (
  id uuid primary key default gen_random_uuid(),
  trend_item_id uuid not null references trend_items (id) on delete cascade,
  content_package_id uuid references content_packages (id) on delete set null,
  platform post_platform not null,
  post_url text,
  posted_at timestamptz,
  post_status post_status not null default 'draft',
  hook_used text,
  format_used text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_trend_item_id_idx on posts (trend_item_id);

create trigger posts_updated_at
  before update on posts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. performance_snapshots — 投稿後の数値を手入力で記録(複数時点)
--    派生指標(save_rate等)は保存せずアプリ側で計算する
-- ---------------------------------------------------------------------------
create table performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  captured_at timestamptz not null default now(),
  views_count bigint not null default 0,
  likes_count bigint not null default 0,
  comments_count bigint not null default 0,
  shares_count bigint not null default 0,
  saves_count bigint not null default 0,
  follows_count bigint not null default 0,
  profile_clicks bigint not null default 0,
  link_clicks bigint not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index performance_snapshots_post_id_idx on performance_snapshots (post_id);

-- ---------------------------------------------------------------------------
-- 6. prompt_templates — AIプロンプトをDBで管理(API Routeが is_active を参照)
-- ---------------------------------------------------------------------------
create table prompt_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  template text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index prompt_templates_active_name_idx
  on prompt_templates (name) where is_active;

create trigger prompt_templates_updated_at
  before update on prompt_templates
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — MVPは個人利用前提のシングルテナント:
--       ログイン済みユーザーなら全操作可。マルチテナント化する際は
--       user_id 列と owner ベースのポリシーに移行する(README参照)。
-- ---------------------------------------------------------------------------
alter table trend_items enable row level security;
alter table trend_analyses enable row level security;
alter table content_packages enable row level security;
alter table posts enable row level security;
alter table performance_snapshots enable row level security;
alter table prompt_templates enable row level security;

create policy "authenticated full access" on trend_items
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on trend_analyses
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on content_packages
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on posts
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on performance_snapshots
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on prompt_templates
  for all to authenticated using (true) with check (true);
