-- クリエイターの外部リンクカラムを追加
alter table public.creator_profiles add column twitter_url text;
alter table public.creator_profiles add column pixiv_url text;
alter table public.creator_profiles add column misskey_url text;
