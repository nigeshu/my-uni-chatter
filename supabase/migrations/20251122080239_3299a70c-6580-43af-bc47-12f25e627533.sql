-- Create course_materials table
CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('file', 'link', 'document', 'video')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Admins can manage all materials
CREATE POLICY "Admins can manage materials"
  ON public.course_materials
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Students can view materials of enrolled courses
CREATE POLICY "Students can view materials of enrolled courses"
  ON public.course_materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = course_materials.course_id
        AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_materials.course_id
        AND c.instructor_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_course_materials_updated_at
  BEFORE UPDATE ON public.course_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();