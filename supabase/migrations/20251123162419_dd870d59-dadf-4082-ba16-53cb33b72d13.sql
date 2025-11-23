-- Create table for tracking working days and holidays
CREATE TABLE public.day_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  is_holiday BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.day_status ENABLE ROW LEVEL SECURITY;

-- Everyone can view day status
CREATE POLICY "Everyone can view day status"
ON public.day_status
FOR SELECT
USING (true);

-- Only admins can manage day status
CREATE POLICY "Admins can manage day status"
ON public.day_status
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));