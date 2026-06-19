-- Bucket cv-intake: staff đọc mọi object để createSignedUrl / list trong CV Queue

drop policy if exists "cv-intake staff select submissions" on storage.objects;
drop policy if exists "cv-intake staff select" on storage.objects;

create policy "cv-intake staff select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cv-intake'
  and public.get_my_role() in (
    'Admin',
    'HH Lead',
    'Headhunter',
    'BD',
    'BD Lead',
    'Researcher',
    'Community Manager'
  )
);
