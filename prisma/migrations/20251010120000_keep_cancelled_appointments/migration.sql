-- Drop the previous unique index that prevented keeping cancelled appointments
DROP INDEX IF EXISTS "Appointment_doctor_user_id_appointment_timestart_appointmen_key";

-- Allow cancelled appointments to retain their original schedule while freeing the slot for new bookings
CREATE UNIQUE INDEX "Appointment_unique_doctor_time_status" ON "public"."Appointment"("doctor_user_id", "appointment_timestart", "appointment_timeend", "status");
