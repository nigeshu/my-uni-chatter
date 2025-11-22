-- Create admin_messages table for managing alert messages
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can view active messages
CREATE POLICY "Everyone can view active messages"
ON public.admin_messages
FOR SELECT
USING (is_active = true);

-- Admins can manage messages
CREATE POLICY "Admins can manage messages"
ON public.admin_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_admin_messages_updated_at
  BEFORE UPDATE ON public.admin_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();