-- ============================================
-- UPDATE STORAGE POLICIES FOR QR CODE UPLOADS
-- ============================================
-- Run this script in Supabase SQL Editor to allow QR code uploads and public access

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Allow QR code uploads" on storage.objects;
drop policy if exists "Public QR code access" on storage.objects;

-- Policy: Allow authenticated users to upload QR codes
create policy "Allow QR code uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'images' 
  and (storage.foldername(name))[1] = 'qr-codes'
);

-- Policy: Allow public read access to QR codes (for email display)
-- This is important so QR codes can be displayed in emails without authentication
create policy "Public QR code access"
on storage.objects
for select
to public
using (bucket_id = 'images' and (storage.foldername(name))[1] = 'qr-codes');

-- Note: Make sure the 'images' bucket is set to public in Supabase Dashboard
-- Go to Storage > images > Settings > Make bucket public

