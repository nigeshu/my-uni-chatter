-- Create table for semester info (editable by admin)
CREATE TABLE public.semester_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semester_text text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for CGPA semesters
CREATE TABLE public.cgpa_semesters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester_name text NOT NULL,
  credits numeric NOT NULL,
  gpa numeric NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for course marks
CREATE TABLE public.course_marks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_type text NOT NULL CHECK (course_type IN ('theory', 'lab')),
  
  -- Lab components
  lab_internals numeric,
  lab_fat numeric,
  
  -- Theory components
  cat1_mark numeric,
  cat2_mark numeric,
  da1_mark numeric,
  da2_mark numeric,
  da3_mark numeric,
  theory_fat numeric,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(student_id, course_id)
);

-- Enable RLS
ALTER TABLE public.semester_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgpa_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_marks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for semester_info
CREATE POLICY "Everyone can view semester info"
  ON public.semester_info FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage semester info"
  ON public.semester_info FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for cgpa_semesters
CREATE POLICY "Students can view their own CGPA data"
  ON public.cgpa_semesters FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own CGPA data"
  ON public.cgpa_semesters FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own CGPA data"
  ON public.cgpa_semesters FOR UPDATE
  USING (student_id = auth.uid());

CREATE POLICY "Students can delete their own CGPA data"
  ON public.cgpa_semesters FOR DELETE
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all CGPA data"
  ON public.cgpa_semesters FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for course_marks
CREATE POLICY "Students can view their own marks"
  ON public.course_marks FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own marks"
  ON public.course_marks FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own marks"
  ON public.course_marks FOR UPDATE
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all marks"
  ON public.course_marks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all marks"
  ON public.course_marks FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add course_type column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_type text CHECK (course_type IN ('theory', 'lab'));

-- Triggers for updated_at
CREATE TRIGGER update_semester_info_updated_at
  BEFORE UPDATE ON public.semester_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_cgpa_semesters_updated_at
  BEFORE UPDATE ON public.cgpa_semesters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_course_marks_updated_at
  BEFORE UPDATE ON public.course_marks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert default semester info
INSERT INTO public.semester_info (semester_text, is_active)
VALUES ('For Winter Semester 2025 - 2026', true);