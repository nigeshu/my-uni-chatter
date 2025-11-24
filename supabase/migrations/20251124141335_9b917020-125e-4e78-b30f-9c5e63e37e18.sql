-- Create table for storing curated module topic videos
CREATE TABLE public.module_topic_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  video_thumbnail TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.module_topic_videos ENABLE ROW LEVEL SECURITY;

-- Admins can manage videos
CREATE POLICY "Admins can manage topic videos"
ON public.module_topic_videos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Students can view videos of enrolled courses
CREATE POLICY "Students can view topic videos of enrolled courses"
ON public.module_topic_videos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM course_modules cm
    JOIN enrollments e ON e.course_id = cm.course_id
    WHERE cm.id = module_topic_videos.module_id
    AND e.student_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add trigger for updated_at
CREATE TRIGGER update_module_topic_videos_updated_at
BEFORE UPDATE ON public.module_topic_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();