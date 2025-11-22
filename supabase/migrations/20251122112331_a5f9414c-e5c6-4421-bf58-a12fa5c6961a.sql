-- Create semester_settings table for admin controls
CREATE TABLE IF NOT EXISTS public.semester_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_completion_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.semester_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view semester settings"
ON public.semester_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage semester settings"
ON public.semester_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.semester_settings (semester_completion_enabled)
VALUES (false);

-- Create trigger for updated_at
CREATE TRIGGER update_semester_settings_updated_at
BEFORE UPDATE ON public.semester_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();