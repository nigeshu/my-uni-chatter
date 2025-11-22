-- Create course_modules table
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  serial_no TEXT NOT NULL,
  topic TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

-- Admins can manage all modules
CREATE POLICY "Admins can manage modules"
  ON public.course_modules
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Students can view modules of enrolled courses
CREATE POLICY "Students can view modules of enrolled courses"
  ON public.course_modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = course_modules.course_id
        AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_modules.course_id
        AND c.instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_modules.course_id
        AND c.is_published = true
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();