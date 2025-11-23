-- Create storage bucket for workspace files
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-files', 'workspace-files', true);

-- RLS policies for workspace files
CREATE POLICY "Students can upload their own workspace files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'workspace-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own workspace files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'workspace-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can delete their own workspace files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'workspace-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add is_minimized column to workspace_items
ALTER TABLE workspace_items
ADD COLUMN IF NOT EXISTS is_minimized boolean DEFAULT false;