-- ============================================================
-- SaikuCraft DB Schema
-- ============================================================

-- profiles（共通プロフィール）
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  username text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  user_type text not null default 'client' check (user_type in ('creator', 'client', 'both')),
  is_age_verified boolean not null default false,
  is_human_verified boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- creator_profiles（クリエイター専用）
create table public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  bio text,
  status text not null default '停止中' check (status in ('受付中', '停止中')),
  call_ok text not null default '不可' check (call_ok in ('不可', '可', '要相談')),
  max_revisions integer not null default 3,
  ng_content text,
  is_r18_ok boolean not null default false,
  is_commercial_ok boolean not null default false,
  is_urgent_ok boolean not null default false,
  created_at timestamptz not null default now()
);

-- price_menus（料金表）
create table public.price_menus (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.creator_profiles(id) on delete cascade not null,
  label text not null,
  price integer,
  price_note text,
  sort_order integer not null default 0
);

-- tags（タグマスター）
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('ジャンル', 'ソフト', 'スタイル', 'その他'))
);

-- creator_tags（クリエイターとタグの紐付け）
create table public.creator_tags (
  creator_id uuid references public.creator_profiles(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (creator_id, tag_id)
);

-- events（イベントマスター）
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date,
  location text,
  scale text,
  is_permanent boolean not null default false,
  created_at timestamptz not null default now()
);

-- user_events（ユーザーとイベントの紐付け）
create table public.user_events (
  user_id uuid references auth.users(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- listings（募集ページ）
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  budget integer,
  headcount integer not null default 1,
  deadline date,
  application_deadline date,
  event_id uuid references public.events(id) on delete set null,
  status text not null default '募集中' check (status in ('募集中', '選考中', '完了')),
  created_at timestamptz not null default now()
);

-- listing_tags（募集ページとタグの紐付け）
create table public.listing_tags (
  listing_id uuid references public.listings(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (listing_id, tag_id)
);

-- negotiations（指名型取引の交渉）
create table public.negotiations (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  budget integer,
  deadline date,
  reference_images text[],
  status text not null default '交渉中' check (status in ('交渉中', '合意済み', '辞退', 'キャンセル')),
  created_at timestamptz not null default now()
);

-- negotiation_messages（交渉メッセージ）
create table public.negotiation_messages (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid references public.negotiations(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  proposed_budget integer,
  proposed_deadline date,
  message text not null,
  created_at timestamptz not null default now()
);

-- transactions（取引）
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  negotiation_id uuid references public.negotiations(id) on delete set null,
  creator_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,
  status text not null default '取引開始' check (status in ('取引開始', 'ラフ提出待ち', 'ラフ確認中', '詳細ラフ確認中', '着手済み', '納品済み', '完了', '異議申し立て中')),
  stripe_payment_intent_id text,
  deadline date,
  revision_count integer not null default 0,
  max_revisions integer not null default 3,
  delivered_at timestamptz,
  auto_approve_at timestamptz,
  auto_refund_at timestamptz,
  wants_copyright_transfer boolean not null default false,
  wants_portfolio_ban boolean not null default false,
  wants_commercial_use boolean not null default false,
  created_at timestamptz not null default now()
);

-- messages（メッセージ）
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text,
  image_urls text[],
  created_at timestamptz not null default now()
);

-- boosts（BOOST）
create table public.boosts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,
  created_at timestamptz not null default now()
);

-- favorites（お気に入りクリエイター）
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  creator_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (user_id, creator_id)
);

-- notifications（通知）
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('message', 'status_change', 'favorite_available', 'boost_received', 'dispute')),
  title text not null,
  body text,
  is_read boolean not null default false,
  related_id uuid,
  created_at timestamptz not null default now()
);

-- notification_settings（通知設定）
create table public.notification_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  message_email boolean not null default true,
  message_site boolean not null default true,
  status_change_email boolean not null default true,
  status_change_site boolean not null default true,
  favorite_available_email boolean not null default true,
  favorite_available_site boolean not null default true,
  boost_received_email boolean not null default true,
  boost_received_site boolean not null default true,
  dispute_email boolean not null default true,
  dispute_site boolean not null default true
);

-- reports（通報）
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade not null,
  target_type text not null check (target_type in ('profile', 'listing', 'transaction', 'message')),
  target_id uuid not null,
  reason text not null check (reason in ('ai_suspicion', 'inappropriate', 'harassment', 'fraud', 'spam', 'other')),
  detail text,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved')),
  created_at timestamptz not null default now()
);

-- blocks（ブロック）
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references auth.users(id) on delete cascade not null,
  blocked_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

-- negotiation_cooldowns（指名型クールダウン）
create table public.negotiation_cooldowns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references auth.users(id) on delete cascade not null,
  creator_id uuid references auth.users(id) on delete cascade not null,
  available_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_profiles_user_id on public.profiles(user_id);
create index idx_creator_profiles_user_id on public.creator_profiles(user_id);
create index idx_listings_client_id on public.listings(client_id);
create index idx_listings_status on public.listings(status);
create index idx_transactions_creator_id on public.transactions(creator_id);
create index idx_transactions_client_id on public.transactions(client_id);
create index idx_transactions_status on public.transactions(status);
create index idx_messages_transaction_id on public.messages(transaction_id);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_boosts_receiver_id on public.boosts(receiver_id);
create index idx_favorites_user_id on public.favorites(user_id);
create index idx_reports_status on public.reports(status);

-- ============================================================
-- Enable Realtime for messages
-- ============================================================
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- Row Level Security
-- ============================================================

-- profiles
alter table public.profiles enable row level security;

create policy "profiles_select_public" on public.profiles
  for select using (deleted_at is null);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

create policy "profiles_admin_all" on public.profiles
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- creator_profiles
alter table public.creator_profiles enable row level security;

create policy "creator_profiles_select_public" on public.creator_profiles
  for select using (true);

create policy "creator_profiles_insert_own" on public.creator_profiles
  for insert with check (auth.uid() = user_id);

create policy "creator_profiles_update_own" on public.creator_profiles
  for update using (auth.uid() = user_id);

-- price_menus
alter table public.price_menus enable row level security;

create policy "price_menus_select_public" on public.price_menus
  for select using (true);

create policy "price_menus_insert_own" on public.price_menus
  for insert with check (
    exists (select 1 from public.creator_profiles where id = creator_id and user_id = auth.uid())
  );

create policy "price_menus_update_own" on public.price_menus
  for update using (
    exists (select 1 from public.creator_profiles where id = creator_id and user_id = auth.uid())
  );

create policy "price_menus_delete_own" on public.price_menus
  for delete using (
    exists (select 1 from public.creator_profiles where id = creator_id and user_id = auth.uid())
  );

-- tags
alter table public.tags enable row level security;

create policy "tags_select_public" on public.tags
  for select using (true);

create policy "tags_admin_insert" on public.tags
  for insert with check (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- creator_tags
alter table public.creator_tags enable row level security;

create policy "creator_tags_select_public" on public.creator_tags
  for select using (true);

create policy "creator_tags_insert_own" on public.creator_tags
  for insert with check (
    exists (select 1 from public.creator_profiles where id = creator_id and user_id = auth.uid())
  );

create policy "creator_tags_delete_own" on public.creator_tags
  for delete using (
    exists (select 1 from public.creator_profiles where id = creator_id and user_id = auth.uid())
  );

-- events
alter table public.events enable row level security;

create policy "events_select_public" on public.events
  for select using (true);

create policy "events_admin_all" on public.events
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- user_events
alter table public.user_events enable row level security;

create policy "user_events_select_public" on public.user_events
  for select using (true);

create policy "user_events_insert_own" on public.user_events
  for insert with check (auth.uid() = user_id);

create policy "user_events_delete_own" on public.user_events
  for delete using (auth.uid() = user_id);

-- listings
alter table public.listings enable row level security;

create policy "listings_select_public" on public.listings
  for select using (true);

create policy "listings_insert_own" on public.listings
  for insert with check (auth.uid() = client_id);

create policy "listings_update_own" on public.listings
  for update using (auth.uid() = client_id);

-- listing_tags
alter table public.listing_tags enable row level security;

create policy "listing_tags_select_public" on public.listing_tags
  for select using (true);

create policy "listing_tags_insert_own" on public.listing_tags
  for insert with check (
    exists (select 1 from public.listings where id = listing_id and client_id = auth.uid())
  );

create policy "listing_tags_delete_own" on public.listing_tags
  for delete using (
    exists (select 1 from public.listings where id = listing_id and client_id = auth.uid())
  );

-- negotiations
alter table public.negotiations enable row level security;

create policy "negotiations_select_own" on public.negotiations
  for select using (auth.uid() = creator_id or auth.uid() = client_id);

create policy "negotiations_insert_client" on public.negotiations
  for insert with check (auth.uid() = client_id);

create policy "negotiations_update_own" on public.negotiations
  for update using (auth.uid() = creator_id or auth.uid() = client_id);

-- negotiation_messages
alter table public.negotiation_messages enable row level security;

create policy "negotiation_messages_select_own" on public.negotiation_messages
  for select using (
    exists (select 1 from public.negotiations where id = negotiation_id and (creator_id = auth.uid() or client_id = auth.uid()))
  );

create policy "negotiation_messages_insert_own" on public.negotiation_messages
  for insert with check (auth.uid() = sender_id);

-- transactions
alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = creator_id or auth.uid() = client_id);

create policy "transactions_admin_all" on public.transactions
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- messages
alter table public.messages enable row level security;

create policy "messages_select_own" on public.messages
  for select using (
    exists (select 1 from public.transactions where id = transaction_id and (creator_id = auth.uid() or client_id = auth.uid()))
  );

create policy "messages_insert_own" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (select 1 from public.transactions where id = transaction_id and (creator_id = auth.uid() or client_id = auth.uid()))
  );

create policy "messages_admin_select" on public.messages
  for select using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- boosts
alter table public.boosts enable row level security;

create policy "boosts_select_own" on public.boosts
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "boosts_insert_sender" on public.boosts
  for insert with check (auth.uid() = sender_id);

-- favorites
alter table public.favorites enable row level security;

create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);

create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = user_id);

-- notifications
alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);

-- notification_settings
alter table public.notification_settings enable row level security;

create policy "notification_settings_select_own" on public.notification_settings
  for select using (auth.uid() = user_id);

create policy "notification_settings_insert_own" on public.notification_settings
  for insert with check (auth.uid() = user_id);

create policy "notification_settings_update_own" on public.notification_settings
  for update using (auth.uid() = user_id);

-- reports
alter table public.reports enable row level security;

create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "reports_select_admin" on public.reports
  for select using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

create policy "reports_update_admin" on public.reports
  for update using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
  );

-- blocks
alter table public.blocks enable row level security;

create policy "blocks_select_own" on public.blocks
  for select using (auth.uid() = blocker_id);

create policy "blocks_insert_own" on public.blocks
  for insert with check (auth.uid() = blocker_id);

create policy "blocks_delete_own" on public.blocks
  for delete using (auth.uid() = blocker_id);

-- negotiation_cooldowns
alter table public.negotiation_cooldowns enable row level security;

create policy "cooldowns_select_own" on public.negotiation_cooldowns
  for select using (auth.uid() = client_id);
