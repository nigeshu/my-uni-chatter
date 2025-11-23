-- Add exam_type and sub_category columns to exams table
ALTER TABLE public.exams
ADD COLUMN exam_type TEXT NOT NULL DEFAULT 'theory',
ADD COLUMN sub_category TEXT NOT NULL DEFAULT 'Cat 1';

-- Add check constraint for exam_type
ALTER TABLE public.exams
ADD CONSTRAINT exams_exam_type_check 
CHECK (exam_type IN ('theory', 'lab', 'non_graded'));