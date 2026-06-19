-- Storage public-assets: ảnh landing HH tại landing/{auth.uid()}/*
-- Cần SELECT (upsert), INSERT, UPDATE, DELETE trong thư mục của mình.

drop policy if exists "public-assets internal can insert landing" on storage.objects;
drop policy if exists "public-assets internal can update landing" on storage.objects;
drop policy if exists "public-assets internal can delete landing" on storage.objects;
drop policy if exists "public-assets landing insert own folder" on storage.objects;
drop policy if exists "public-assets landing update own folder" on storage.objects;
drop policy if exists "public-assets landing delete own folder" on storage.objects;
drop policy if exists "public-assets landing select own folder" on storage.objects;

create policy "public-assets landing select own folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'public-assets'
  and split_part(name, '/', 1) = 'landing'
  and split_part(name, '/', 2) = auth.uid()::text
);

create policy "public-assets landing insert own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'public-assets'
  and split_part(name, '/', 1) = 'landing'
  and split_part(name, '/', 2) = auth.uid()::text
);

create policy "public-assets landing update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'public-assets'
  and split_part(name, '/', 1) = 'landing'
  and split_part(name, '/', 2) = auth.uid()::text
)
with check (
  bucket_id = 'public-assets'
  and split_part(name, '/', 1) = 'landing'
  and split_part(name, '/', 2) = auth.uid()::text
);

create policy "public-assets landing delete own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'public-assets'
  and split_part(name, '/', 1) = 'landing'
  and split_part(name, '/', 2) = auth.uid()::text
);
