-- Add category field to sessions table for organizing sessions by topic

ALTER TABLE kilat_baca.sessions 
ADD COLUMN category TEXT;

-- Index for efficient category filtering
CREATE INDEX sessions_category_idx ON kilat_baca.sessions(category) 
WHERE category IS NOT NULL;

-- Also index by teacher_id + category for dashboard queries
CREATE INDEX sessions_teacher_category_idx ON kilat_baca.sessions(teacher_id, category);
