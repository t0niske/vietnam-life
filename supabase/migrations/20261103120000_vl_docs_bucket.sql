-- private file storage for documents (apartment rental contracts): only members read, add and delete them
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vl-docs', 'vl-docs', false, 15728640,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "members read docs" on storage.objects
  for select to authenticated using (bucket_id = 'vl-docs' and (select private.vl_is_member()));
create policy "members add docs" on storage.objects
  for insert to authenticated with check (bucket_id = 'vl-docs' and (select private.vl_is_member()));
create policy "members delete docs" on storage.objects
  for delete to authenticated using (bucket_id = 'vl-docs' and (select private.vl_is_member()));
