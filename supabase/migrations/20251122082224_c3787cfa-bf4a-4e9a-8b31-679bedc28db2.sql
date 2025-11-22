-- Verify and update RLS policies for course_materials to ensure students can access materials

-- First, let's check the current policy and update it if needed
DROP POLICY IF EXISTS "Students can view materials of enrolled courses" ON course_materials;

-- Create a more robust policy for students to view materials
CREATE POLICY "Students can view materials of enrolled courses" 
ON course_materials 
FOR SELECT 
USING (
  -- Allow if user is enrolled in the course
  EXISTS (
    SELECT 1 
    FROM enrollments e
    WHERE e.course_id = course_materials.course_id 
    AND e.student_id = auth.uid()
  )
  -- OR if user is the instructor of the course
  OR EXISTS (
    SELECT 1 
    FROM courses c
    WHERE c.id = course_materials.course_id 
    AND c.instructor_id = auth.uid()
  )
  -- OR if user has admin role
  OR has_role(auth.uid(), 'admin'::app_role)
);