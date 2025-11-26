-- Allow students to delete their own submissions
CREATE POLICY "Students can delete their own submissions"
ON public.submissions
FOR DELETE
USING (student_id = auth.uid());