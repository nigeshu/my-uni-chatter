-- Create assignment requests table
CREATE TABLE public.assignment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  assignment_title TEXT NOT NULL,
  what_to_do TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material contributions table
CREATE TABLE public.material_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_title TEXT NOT NULL,
  module_name TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignment_requests
CREATE POLICY "Students can view their own requests"
  ON public.assignment_requests
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create requests"
  ON public.assignment_requests
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all requests"
  ON public.assignment_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests"
  ON public.assignment_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for material_contributions
CREATE POLICY "Students can view their own contributions"
  ON public.material_contributions
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create contributions"
  ON public.material_contributions
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all contributions"
  ON public.material_contributions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contributions"
  ON public.material_contributions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_assignment_requests_updated_at
  BEFORE UPDATE ON public.assignment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_material_contributions_updated_at
  BEFORE UPDATE ON public.material_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();