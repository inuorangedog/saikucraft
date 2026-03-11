-- ポートフォリオ作品テーブル
create table portfolios (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creator_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  image_url text not null,
  tags text[] default '{}',
  sort_order int not null default 0,
  is_r18 boolean not null default false,
  created_at timestamptz not null default now()
);

-- インデックス
create index idx_portfolios_user_id on portfolios(user_id);
create index idx_portfolios_creator_id on portfolios(creator_id);

-- RLS
alter table portfolios enable row level security;

-- 誰でも閲覧可能
create policy "portfolios_select" on portfolios
  for select using (true);

-- 自分の作品のみ作成・更新・削除可能
create policy "portfolios_insert" on portfolios
  for insert with check (auth.uid() = user_id);

create policy "portfolios_update" on portfolios
  for update using (auth.uid() = user_id);

create policy "portfolios_delete" on portfolios
  for delete using (auth.uid() = user_id);
