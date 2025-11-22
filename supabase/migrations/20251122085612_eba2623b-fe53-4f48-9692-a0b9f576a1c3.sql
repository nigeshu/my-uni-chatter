-- Ensure the bucket is properly configured for public access
UPDATE storage.buckets 
SET public = true, 
    file_size_limit = 52428800, -- 50MB limit
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
WHERE id = 'course_materials';