-- Create storage bucket for profiles if it doesn't exist
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files to the profiles bucket
create policy "Allow authenticated users to upload files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] in ('avatars', 'covers')
);

-- Allow authenticated users to update their own files
create policy "Allow users to update their own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow public access to read files
create policy "Allow public read access"
on storage.objects for select
to public
using (bucket_id = 'profiles');

-- Allow authenticated users to delete their own files
create policy "Allow users to delete their own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[2]
); 