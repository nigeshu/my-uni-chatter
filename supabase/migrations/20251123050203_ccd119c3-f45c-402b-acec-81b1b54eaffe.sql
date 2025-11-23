-- Create workspace items table for My Space
CREATE TABLE IF NOT EXISTS public.workspace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'note', 'plan', 'file', 'link'
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 300,
  height INTEGER NOT NULL DEFAULT 200,
  color TEXT NOT NULL DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create connections table for linking workspace items
CREATE TABLE IF NOT EXISTS public.workspace_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_item_id UUID NOT NULL REFERENCES public.workspace_items(id) ON DELETE CASCADE,
  to_item_id UUID NOT NULL REFERENCES public.workspace_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for workspace_items
CREATE POLICY "Students can view their own workspace items"
ON public.workspace_items
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own workspace items"
ON public.workspace_items
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own workspace items"
ON public.workspace_items
FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own workspace items"
ON public.workspace_items
FOR DELETE
USING (auth.uid() = student_id);

-- RLS policies for workspace_connections
CREATE POLICY "Students can view their own workspace connections"
ON public.workspace_connections
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own workspace connections"
ON public.workspace_connections
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete their own workspace connections"
ON public.workspace_connections
FOR DELETE
USING (auth.uid() = student_id);

-- Create indexes
CREATE INDEX idx_workspace_items_student ON public.workspace_items(student_id);
CREATE INDEX idx_workspace_connections_student ON public.workspace_connections(student_id);
CREATE INDEX idx_workspace_connections_from ON public.workspace_connections(from_item_id);
CREATE INDEX idx_workspace_connections_to ON public.workspace_connections(to_item_id);