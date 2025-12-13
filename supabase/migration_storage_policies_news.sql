-- ============================================
-- MIGRATION: Add Storage Policies for News Banner Images
-- Run this script in Supabase SQL Editor
-- ============================================

-- Policy: Allow authenticated users (admins) to upload files to news/ folder
CREATE POLICY IF NOT EXISTS "Admins can upload news banner images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = 'news'
);

-- Policy: Allow authenticated users to read news banner images
CREATE POLICY IF NOT EXISTS "Anyone can view news banner images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = 'news'
);

-- Policy: Allow public read access to news banner images (for public display)
CREATE POLICY IF NOT EXISTS "Public news banner image access"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = 'news'
);

-- Policy: Allow authenticated users (admins) to delete news banner images
CREATE POLICY IF NOT EXISTS "Admins can delete news banner images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = 'news'
);

-- Policy: Allow authenticated users (admins) to update news banner images
CREATE POLICY IF NOT EXISTS "Admins can update news banner images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = 'news'
)
WITH CHECK (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = 'news'
);

-- ============================================
-- Migration Complete
-- ============================================

