-- RPC: danh sách subdomain_slug đã dùng (tránh trùng khi tạo landing)

create or replace function public.list_taken_landing_slugs(p_exclude_user_id uuid default null)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select subdomain_slug
  from public.headhunter_landing_pages
  where p_exclude_user_id is null or user_id <> p_exclude_user_id
  order by subdomain_slug;
$$;

revoke all on function public.list_taken_landing_slugs(uuid) from public;
grant execute on function public.list_taken_landing_slugs(uuid) to authenticated;
