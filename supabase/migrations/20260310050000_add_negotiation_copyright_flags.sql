-- negotiations に著作権関連フラグを追加
alter table public.negotiations add column if not exists wants_copyright_transfer boolean not null default false;
alter table public.negotiations add column if not exists wants_portfolio_ban boolean not null default false;
alter table public.negotiations add column if not exists wants_commercial_use boolean not null default false;
