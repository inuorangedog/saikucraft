-- creator_profilesにStripe Connect アカウントIDを追加
alter table public.creator_profiles add column stripe_account_id text;
alter table public.creator_profiles add column stripe_onboarded boolean not null default false;

-- transactionsにStripe関連カラムを追加
alter table public.transactions add column stripe_transfer_id text;
alter table public.transactions add column stripe_refund_id text;
alter table public.transactions add column payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'transferred', 'refunded', 'partially_refunded'));
