-- Create calendar_settings table to store academic year date range
CREATE TABLE IF NOT EXISTS public.calendar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active calendar settings
CREATE POLICY "Everyone can view active calendar settings"
ON public.calendar_settings
FOR SELECT
USING (is_active = true);

-- Policy: Admins can manage calendar settings
CREATE POLICY "Admins can manage calendar settings"
ON public.calendar_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_calendar_settings_updated_at
BEFORE UPDATE ON public.calendar_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();