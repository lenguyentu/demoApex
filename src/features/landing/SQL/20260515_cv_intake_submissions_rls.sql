-- CV intake từ landing (bucket cv-intake) — cột mở rộng + RLS cho staff
-- Chạy trên Supabase SQL Editor (bảng cv_intake_submissions đã có sẵn).

alter table public.cv_intake_submissions
  add column if not exists job_ref text,
  add column if not exists job_title text,
  add column if not exists apply_type text check (apply_type in ('job', 'advice')),
  add column if not exists context_job_ref text,
  add column if not exists context_job_title text,
  add column if not exists team_slug text;

create index if not exists idx_cv_intake_team_slug
  on public.cv_intake_submissions (team_slug, created_at desc);

alter table public.cv_intake_submissions enable row level security;

-- Roles được xem / cập nhật CV Queue landing
-- Admin, HH Lead, Headhunter, BD, BD Lead, Researcher, Community Manager

drop policy if exists "cv_intake_select_staff" on public.cv_intake_submissions;
create policy "cv_intake_select_staff"
  on public.cv_intake_submissions
  for select
  to authenticated
  using (
    public.get_my_role() in (
      'Admin',
      'HH Lead',
      'Headhunter',
      'BD',
      'BD Lead',
      'Researcher',
      'Community Manager'
    )
  );

drop policy if exists "cv_intake_update_staff" on public.cv_intake_submissions;
create policy "cv_intake_update_staff"
  on public.cv_intake_submissions
  for update
  to authenticated
  using (
    public.get_my_role() in (
      'Admin',
      'HH Lead',
      'Headhunter',
      'BD',
      'BD Lead',
      'Researcher',
      'Community Manager'
    )
  )
  with check (
    public.get_my_role() in (
      'Admin',
      'HH Lead',
      'Headhunter',
      'BD',
      'BD Lead',
      'Researcher',
      'Community Manager'
    )
  );

comment on table public.cv_intake_submissions is 'Landing CV uploads; files in bucket cv-intake';
