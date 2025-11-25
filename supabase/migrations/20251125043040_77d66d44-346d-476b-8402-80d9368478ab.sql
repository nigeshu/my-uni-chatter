-- Create course_slots table for theory courses
CREATE TABLE IF NOT EXISTS public.course_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  slot_name TEXT NOT NULL,
  days TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add columns to enrollments for student selections
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS selected_slot_id UUID REFERENCES public.course_slots(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS selected_lab_days TEXT[];

-- Enable RLS on course_slots
ALTER TABLE public.course_slots ENABLE ROW LEVEL SECURITY;

-- Admins can manage slots
CREATE POLICY "Admins can manage course slots"
ON public.course_slots
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Students can view slots of published courses
CREATE POLICY "Students can view slots of published courses"
ON public.course_slots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_slots.course_id
    AND (c.is_published = true OR c.instructor_id = auth.uid())
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_course_slots_updated_at
BEFORE UPDATE ON public.course_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();