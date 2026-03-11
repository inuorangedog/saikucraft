-- 納品ファイル情報カラムを追加
alter table public.transactions add column delivery_file_url text;
alter table public.transactions add column delivery_file_name text;
alter table public.transactions add column delivery_file_key text;
