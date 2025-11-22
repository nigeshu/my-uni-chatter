-- Fix storage policies for course_materials bucket to allow student uploads
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can upload course materials" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course materials" ON storage.objects;

-- Allow authenticated users (students) to upload to course_materials bucket
CREATE POLICY "Students can upload course materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course_materials');

-- Allow anyone to view course materials (since bucket is public)
CREATE POLICY "Anyone can view course materials"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'course_materials');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'course_materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add file_url column to assignment_requests for optional document uploads
ALTER TABLE assignment_requests ADD COLUMN IF NOT EXISTS file_url TEXT;