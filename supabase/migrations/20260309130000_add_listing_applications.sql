-- 募集への応募テーブル
create table public.listing_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  creator_id uuid references auth.users(id) on delete cascade not null,
  message text,
  proposed_budget integer,
  proposed_deadline date,
  status text not null default '応募中' check (status in ('応募中', '採用', '不採用', '辞退')),
  created_at timestamptz not null default now(),
  unique (listing_id, creator_id)
);

create index idx_listing_applications_listing_id on public.listing_applications(listing_id);
create index idx_listing_applications_creator_id on public.listing_applications(creator_id);

-- RLS
alter table public.listing_applications enable row level security;

-- 応募者は自分の応募を見れる
create policy "applications_select_own" on public.listing_applications
  for select using (creator_id = auth.uid());

-- 募集の依頼者は全応募を見れる
create policy "applications_select_listing_owner" on public.listing_applications
  for select using (
    exists (select 1 from public.listings where id = listing_id and client_id = auth.uid())
  );

-- クリエイターが応募できる
create policy "applications_insert_creator" on public.listing_applications
  for insert with check (creator_id = auth.uid());

-- 応募者は自分の応募をupdate（辞退）
create policy "applications_update_own" on public.listing_applications
  for update using (creator_id = auth.uid());

-- 募集の依頼者がupdate（採用/不採用）
create policy "applications_update_listing_owner" on public.listing_applications
  for update using (
    exists (select 1 from public.listings where id = listing_id and client_id = auth.uid())
  );
