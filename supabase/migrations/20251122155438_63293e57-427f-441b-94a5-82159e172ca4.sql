-- Add delete policy for courses table
CREATE POLICY "Admins can delete courses"
ON public.courses
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));