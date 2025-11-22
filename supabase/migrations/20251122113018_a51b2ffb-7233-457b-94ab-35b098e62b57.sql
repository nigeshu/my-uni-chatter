-- Add graded_credits column to cgpa_semesters table
ALTER TABLE cgpa_semesters ADD COLUMN graded_credits numeric NOT NULL DEFAULT 0;