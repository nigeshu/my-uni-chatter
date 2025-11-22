-- Add credits and class_days columns to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS credits integer,
ADD COLUMN IF NOT EXISTS class_days text[];

-- Add a comment for clarity
COMMENT ON COLUMN public.courses.credits IS 'Total credits for the course';
COMMENT ON COLUMN public.courses.class_days IS 'Array of days when classes are held (e.g., Monday, Wednesday, Friday)';