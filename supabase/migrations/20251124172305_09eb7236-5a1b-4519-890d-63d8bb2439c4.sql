-- Create video categories table
CREATE TABLE IF NOT EXISTS public.course_video_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create course videos table
CREATE TABLE IF NOT EXISTS public.course_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.course_video_categories(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  video_thumbnail TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for video categories
CREATE POLICY "Admins can manage video categories"
ON public.course_video_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view video categories of enrolled courses"
ON public.course_video_categories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = course_video_categories.course_id
    AND e.student_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- RLS policies for videos
CREATE POLICY "Admins can manage videos"
ON public.course_videos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view videos in enrolled courses"
ON public.course_videos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.course_video_categories vc
    JOIN public.enrollments e ON e.course_id = vc.course_id
    WHERE vc.id = course_videos.category_id
    AND e.student_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create indexes
CREATE INDEX idx_video_categories_course ON public.course_video_categories(course_id);
CREATE INDEX idx_video_categories_module ON public.course_video_categories(module_id);
CREATE INDEX idx_videos_category ON public.course_videos(category_id);

-- Triggers for updated_at
CREATE TRIGGER update_video_categories_updated_at
BEFORE UPDATE ON public.course_video_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.course_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();