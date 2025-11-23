-- Create study subjects table
CREATE TABLE IF NOT EXISTS study_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create study categories table
CREATE TABLE IF NOT EXISTS study_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('notes', 'videos')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_subject FOREIGN KEY (subject_id) REFERENCES study_subjects(id) ON DELETE CASCADE
);

-- Create study items table
CREATE TABLE IF NOT EXISTS study_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  youtube_url TEXT,
  video_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES study_categories(id) ON DELETE CASCADE
);

-- Create study plans table
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  subject TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE study_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_subjects
CREATE POLICY "Students can manage their own subjects"
ON study_subjects FOR ALL
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- RLS Policies for study_categories
CREATE POLICY "Students can manage categories of their subjects"
ON study_categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM study_subjects
    WHERE study_subjects.id = study_categories.subject_id
    AND study_subjects.student_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM study_subjects
    WHERE study_subjects.id = study_categories.subject_id
    AND study_subjects.student_id = auth.uid()
  )
);

-- RLS Policies for study_items
CREATE POLICY "Students can manage items in their categories"
ON study_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM study_categories
    JOIN study_subjects ON study_subjects.id = study_categories.subject_id
    WHERE study_categories.id = study_items.category_id
    AND study_subjects.student_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM study_categories
    JOIN study_subjects ON study_subjects.id = study_categories.subject_id
    WHERE study_categories.id = study_items.category_id
    AND study_subjects.student_id = auth.uid()
  )
);

-- RLS Policies for study_plans
CREATE POLICY "Students can manage their own plans"
ON study_plans FOR ALL
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);