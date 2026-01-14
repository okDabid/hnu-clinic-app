-- Drop indexes on available_date if they exist
DROP INDEX IF EXISTS "DoctorAvailability_doctor_user_id_available_date_idx";
DROP INDEX IF EXISTS "DoctorAvailability_clinic_id_available_date_idx";

-- Drop column available_date from DoctorAvailability if exists
ALTER TABLE "DoctorAvailability" DROP COLUMN IF EXISTS "available_date";

-- Create indexes on available_timestart for fast date-range queries
CREATE INDEX IF NOT EXISTS "DoctorAvailability_doctor_user_id_available_timestart_idx" ON "public"."DoctorAvailability" ("doctor_user_id", "available_timestart");
CREATE INDEX IF NOT EXISTS "DoctorAvailability_clinic_id_available_timestart_idx" ON "public"."DoctorAvailability" ("clinic_id", "available_timestart");
