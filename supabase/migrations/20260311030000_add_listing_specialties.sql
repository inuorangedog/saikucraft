-- 募集 × 職種 中間テーブル
create table listing_specialties (
  listing_id uuid not null references listings(id) on delete cascade,
  specialty_id uuid not null references specialties(id) on delete cascade,
  primary key (listing_id, specialty_id)
);

-- RLS
alter table listing_specialties enable row level security;

create policy "listing_specialties_select" on listing_specialties for select using (true);

create policy "listing_specialties_insert" on listing_specialties for insert with check (
  listing_id in (
    select id from listings where client_id = auth.uid()
  )
);

create policy "listing_specialties_delete" on listing_specialties for delete using (
  listing_id in (
    select id from listings where client_id = auth.uid()
  )
);
