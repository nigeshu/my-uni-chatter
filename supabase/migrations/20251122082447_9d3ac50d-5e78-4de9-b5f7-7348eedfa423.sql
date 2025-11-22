-- Add module_id to course_materials table to associate materials with modules
ALTER TABLE course_materials 
ADD COLUMN module_id uuid REFERENCES course_modules(id) ON DELETE SET NULL;

-- Create an index for better query performance
CREATE INDEX idx_course_materials_module_id ON course_materials(module_id);