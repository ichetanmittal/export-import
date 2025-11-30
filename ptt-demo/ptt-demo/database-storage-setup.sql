-- Supabase Storage Setup for PTT Demo
-- Run this in your Supabase SQL Editor

-- Create storage bucket for PTT documents
-- NOTE: If bucket 'ptt-documents' already exists, you can skip the INSERT
INSERT INTO storage.buckets (id, name, public)
VALUES ('ptt-documents', 'ptt-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ptt-documents bucket

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ptt-documents');

-- Allow authenticated users to read their own files
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ptt-documents');

-- Allow users to update their files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ptt-documents');

-- Allow users to delete their files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ptt-documents');

-- Optional: More restrictive policy - only allow file owner to access
-- Uncomment if you want stricter access control
/*
CREATE POLICY "Users can only access their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
*/
