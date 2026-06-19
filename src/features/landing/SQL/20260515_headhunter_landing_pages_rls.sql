-- headhunter_landing_pages — HH CRUD landing của mình (1 row / user)
-- Bảng đã có trên Supabase; file này chỉ RLS + grant.

alter table public.headhunter_landing_pages enable row level security;

grant select, insert, update on public.headhunter_landing_pages to authenticated;

drop policy if exists "landing_select_own_or_lead" on public.headhunter_landing_pages;
drop policy if exists "landing_insert_own" on public.headhunter_landing_pages;
drop policy if exists "landing_update_own" on public.headhunter_landing_pages;
drop policy if exists "landing_delete_own" on public.headhunter_landing_pages;
drop policy if exists "hlp_select_own" on public.headhunter_landing_pages;
drop policy if exists "hlp_select_admin_lead" on public.headhunter_landing_pages;
drop policy if exists "hlp_insert_own" on public.headhunter_landing_pages;
drop policy if exists "hlp_update_own" on public.headhunter_landing_pages;
drop policy if exists "hlp_delete_own" on public.headhunter_landing_pages;

create policy "hlp_select_own"
  on public.headhunter_landing_pages
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "hlp_select_admin_lead"
  on public.headhunter_landing_pages
  for select
  to authenticated
  using (
    public.get_my_role() = 'Admin'
    or (
      public.get_my_role() = 'HH Lead'
      and exists (
        select 1
        from public.users u
        where u.id = headhunter_landing_pages.user_id
          and u.managed_by_id = auth.uid()
      )
    )
  );

create policy "hlp_insert_own"
  on public.headhunter_landing_pages
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "hlp_update_own"
  on public.headhunter_landing_pages
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "hlp_delete_own"
  on public.headhunter_landing_pages
  for delete
  to authenticated
  using (user_id = auth.uid() or public.get_my_role() = 'Admin');
