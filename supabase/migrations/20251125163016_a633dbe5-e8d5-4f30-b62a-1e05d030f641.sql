-- Create table for course PYQs (Previous Year Questions)
CREATE TABLE public.course_pyqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_pyqs ENABLE ROW LEVEL SECURITY;

-- Admins can manage PYQs
CREATE POLICY "Admins can manage PYQs"
ON public.course_pyqs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Students can view PYQs of enrolled courses
CREATE POLICY "Students can view PYQs of enrolled courses"
ON public.course_pyqs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.course_id = course_pyqs.course_id
    AND e.student_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add trigger for updated_at
CREATE TRIGGER update_course_pyqs_updated_at
BEFORE UPDATE ON public.course_pyqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();