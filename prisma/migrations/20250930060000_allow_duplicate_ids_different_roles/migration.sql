-- Drop unique constraints enforcing global student/employee IDs
DROP INDEX IF EXISTS "Student_student_id_key";
DROP INDEX IF EXISTS "Employee_employee_id_key";

-- Add indexes to keep lookups fast after relaxing uniqueness
CREATE INDEX IF NOT EXISTS "Student_student_id_idx" ON "public"."Student" ("student_id");
CREATE INDEX IF NOT EXISTS "Employee_employee_id_idx" ON "public"."Employee" ("employee_id");
