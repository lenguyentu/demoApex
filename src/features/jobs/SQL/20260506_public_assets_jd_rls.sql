-- JD public link policies for storage bucket: public-assets
-- Muc tieu:
-- 1) Chi role noi bo duoc upload file jobs/* (INSERT/UPDATE/DELETE)
-- 2) User dang nhap nao cung co the doc metadata objects trong bucket nay (SELECT)
--    (Public URL van truy cap duoc neu bucket de public)

-- SELECT metadata chi cho role noi bo (tranh client list toan bo file trong bucket)
drop policy if exists "public-assets authenticated can select"
on storage.objects;

drop policy if exists "public-assets internal can select jobs"
on storage.objects;

create policy "public-assets internal can select jobs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'public-assets'
  and (storage.foldername(name))[1] = 'jobs'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = any (
        array[
          'Admin'::public.user_role_enum,
          'HR'::public.user_role_enum,
          'Manager'::public.user_role_enum,
          'Headhunter'::public.user_role_enum,
          'BD'::public.user_role_enum,
          'BD Lead'::public.user_role_enum,
          'HH Lead'::public.user_role_enum,
          'Community Manager'::public.user_role_enum
        ]
      )
  )
);

-- INSERT chi cho role noi bo, gioi han trong prefix jobs/
drop policy if exists "public-assets internal can insert jobs"
on storage.objects;

create policy "public-assets internal can insert jobs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'public-assets'
  and (storage.foldername(name))[1] = 'jobs'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = any (
        array[
          'Admin'::public.user_role_enum,
          'HR'::public.user_role_enum,
          'Manager'::public.user_role_enum,
          'Headhunter'::public.user_role_enum,
          'BD'::public.user_role_enum,
          'BD Lead'::public.user_role_enum,
          'HH Lead'::public.user_role_enum,
          'Community Manager'::public.user_role_enum
        ]
      )
  )
);

-- UPDATE chi cho role noi bo trong prefix jobs/
drop policy if exists "public-assets internal can update jobs"
on storage.objects;

create policy "public-assets internal can update jobs"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'public-assets'
  and (storage.foldername(name))[1] = 'jobs'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = any (
        array[
          'Admin'::public.user_role_enum,
          'HR'::public.user_role_enum,
          'Manager'::public.user_role_enum,
          'Headhunter'::public.user_role_enum,
          'BD'::public.user_role_enum,
          'BD Lead'::public.user_role_enum,
          'HH Lead'::public.user_role_enum,
          'Community Manager'::public.user_role_enum
        ]
      )
  )
)
with check (
  bucket_id = 'public-assets'
  and (storage.foldername(name))[1] = 'jobs'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = any (
        array[
          'Admin'::public.user_role_enum,
          'HR'::public.user_role_enum,
          'Manager'::public.user_role_enum,
          'Headhunter'::public.user_role_enum,
          'BD'::public.user_role_enum,
          'BD Lead'::public.user_role_enum,
          'HH Lead'::public.user_role_enum,
          'Community Manager'::public.user_role_enum
        ]
      )
  )
);

-- DELETE chi cho role noi bo trong prefix jobs/
drop policy if exists "public-assets internal can delete jobs"
on storage.objects;

create policy "public-assets internal can delete jobs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'public-assets'
  and (storage.foldername(name))[1] = 'jobs'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = any (
        array[
          'Admin'::public.user_role_enum,
          'HR'::public.user_role_enum,
          'Manager'::public.user_role_enum,
          'Headhunter'::public.user_role_enum,
          'BD'::public.user_role_enum,
          'BD Lead'::public.user_role_enum,
          'HH Lead'::public.user_role_enum,
          'Community Manager'::public.user_role_enum
        ]
      )
  )
);
