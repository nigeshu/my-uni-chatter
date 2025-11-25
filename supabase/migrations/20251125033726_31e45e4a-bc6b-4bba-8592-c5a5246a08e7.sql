-- Change credits column from integer to numeric to support 0.5 increments
ALTER TABLE public.courses 
ALTER COLUMN credits TYPE numeric USING credits::numeric;

-- Add a check constraint to ensure only whole numbers and 0.5 increments are allowed
ALTER TABLE public.courses
ADD CONSTRAINT credits_half_increment_check 
CHECK (credits IS NULL OR (credits * 2) % 1 = 0);