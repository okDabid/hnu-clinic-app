-- Drop the unique constraint on Student.student_id to allow the same ID
-- to be used by different roles (e.g., patient students vs working scholars).
DROP INDEX IF EXISTS "Student_student_id_key";
