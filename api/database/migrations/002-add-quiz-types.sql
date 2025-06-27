-- Migration to add support for different quiz types
-- Run this after the initial database setup

-- Add new columns to quizzes table
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS quiz_type VARCHAR(50) DEFAULT 'multiple-choice',
ADD COLUMN IF NOT EXISTS schema_version INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS question_types JSONB DEFAULT '["multiple-choice"]'::jsonb;

-- Update existing quizzes to have the new fields
UPDATE quizzes 
SET 
    quiz_type = 'multiple-choice',
    schema_version = 2,
    question_types = '["multiple-choice"]'::jsonb
WHERE quiz_type IS NULL OR schema_version IS NULL;

-- Create index on quiz_type for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_type ON quizzes(quiz_type);
CREATE INDEX IF NOT EXISTS idx_quizzes_schema_version ON quizzes(schema_version);

-- Add GIN index on question_types JSONB for efficient queries
CREATE INDEX IF NOT EXISTS idx_quizzes_question_types ON quizzes USING GIN (question_types);

-- Update quiz_attempts table to handle different answer formats
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS answer_format VARCHAR(50) DEFAULT 'multiple-choice';

-- Create updated comment on quizzes table
COMMENT ON TABLE quizzes IS 'Stores quiz data with support for multiple question types including multiple-choice, flashcards, true-false, fill-in-blank, matching, multiple-select, short-answer, and ordering questions';

COMMENT ON COLUMN quizzes.quiz_type IS 'Type of quiz: mixed, multiple-choice, flashcard, true-false, fill-in-blank, matching, multiple-select, short-answer, ordering';
COMMENT ON COLUMN quizzes.schema_version IS 'Schema version for backward compatibility and migrations';
COMMENT ON COLUMN quizzes.question_types IS 'Array of question types used in this quiz';
COMMENT ON COLUMN quizzes.quiz_data IS 'JSONB containing the full quiz structure with polymorphic questions';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Quiz types migration completed successfully!';
    RAISE NOTICE 'Added support for: multiple-choice, flashcard, true-false, fill-in-blank, matching, multiple-select, short-answer, ordering';
END $$;