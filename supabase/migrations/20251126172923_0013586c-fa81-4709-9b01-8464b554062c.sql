-- Add slot_id to assignments table
ALTER TABLE assignments ADD COLUMN slot_id uuid REFERENCES course_slots(id) ON DELETE SET NULL;

-- Add slot_name to assignment_requests table
ALTER TABLE assignment_requests ADD COLUMN slot_name text;