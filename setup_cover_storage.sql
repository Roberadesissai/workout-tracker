-- Create storage bucket for cover photos if it doesn't exist
insert into storage.buckets (id, name, public)
values ('cover_photos', 'cover_photos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload cover photos
create policy "Allow authenticated users to upload cover photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'cover_photos');

-- Allow authenticated users to update their own cover photos
create policy "Allow users to update their own cover photos"
on storage.objects for update
to authenticated
using (bucket_id = 'cover_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to read cover photos
create policy "Allow public read access to cover photos"
on storage.objects for select
to public
using (bucket_id = 'cover_photos');

-- Allow authenticated users to delete their own cover photos
create policy "Allow users to delete their own cover photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'cover_photos' AND auth.uid()::text = (storage.foldername(name))[1]); 