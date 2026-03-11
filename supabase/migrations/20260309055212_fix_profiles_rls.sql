-- profiles_admin_all が profiles 自身を参照して無限再帰になるため削除し、
-- auth.jwt() から role を取得する方式に変更

drop policy "profiles_admin_all" on public.profiles;

-- admin判定用の関数（profiles テーブルを参照せず JWT から判定）
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  )
$$;

-- admin用ポリシー: security definer関数経由で再帰を回避
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());

create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin());

create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());
