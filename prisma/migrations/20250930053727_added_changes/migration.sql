/*
  Warnings:

  - The `service_type` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[doctor_user_id,appointment_timestart,appointment_timeend]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `status` on the `Appointment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `Users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('NURSE', 'DOCTOR', 'SCHOLAR', 'PATIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('Pending', 'Approved', 'Moved', 'Cancelled', 'Completed');

-- CreateEnum
CREATE TYPE "public"."ServiceType" AS ENUM ('Consultation', 'Dental', 'Assessment', 'Other');

-- DropForeignKey
ALTER TABLE "public"."Appointment" DROP CONSTRAINT "Appointment_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Appointment" DROP CONSTRAINT "Appointment_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Appointment" DROP CONSTRAINT "Appointment_doctor_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Appointment" DROP CONSTRAINT "Appointment_patient_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Consultation" DROP CONSTRAINT "Consultation_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Consultation" DROP CONSTRAINT "Consultation_doctor_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."DoctorAvailability" DROP CONSTRAINT "DoctorAvailability_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."DoctorAvailability" DROP CONSTRAINT "DoctorAvailability_doctor_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Employee" DROP CONSTRAINT "Employee_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."MedCert" DROP CONSTRAINT "MedCert_consultation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."MedCert" DROP CONSTRAINT "MedCert_issued_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."MedCert" DROP CONSTRAINT "MedCert_patient_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."MedDispense" DROP CONSTRAINT "MedDispense_consultation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."MedDispense" DROP CONSTRAINT "MedDispense_med_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."MedInventory" DROP CONSTRAINT "MedInventory_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Replenishment" DROP CONSTRAINT "Replenishment_med_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Student" DROP CONSTRAINT "Student_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Appointment" ALTER COLUMN "created_by_user_id" DROP NOT NULL,
DROP COLUMN "service_type",
ADD COLUMN     "service_type" "public"."ServiceType",
DROP COLUMN "status",
ADD COLUMN     "status" "public"."AppointmentStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Consultation" ALTER COLUMN "doctor_user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."MedCert" ALTER COLUMN "issued_by_user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Replenishment" ADD COLUMN     "remaining_qty" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Users" DROP COLUMN "role",
ADD COLUMN     "role" "public"."Role" NOT NULL;

-- CreateIndex
CREATE INDEX "Appointment_doctor_user_id_appointment_date_status_idx" ON "public"."Appointment"("doctor_user_id", "appointment_date", "status");

-- CreateIndex
CREATE INDEX "Appointment_patient_user_id_appointment_date_status_idx" ON "public"."Appointment"("patient_user_id", "appointment_date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_doctor_user_id_appointment_timestart_appointmen_key" ON "public"."Appointment"("doctor_user_id", "appointment_timestart", "appointment_timeend");

-- CreateIndex
CREATE INDEX "DoctorAvailability_doctor_user_id_available_date_idx" ON "public"."DoctorAvailability"("doctor_user_id", "available_date");

-- CreateIndex
CREATE INDEX "DoctorAvailability_clinic_id_available_date_idx" ON "public"."DoctorAvailability"("clinic_id", "available_date");

-- CreateIndex
CREATE INDEX "MedDispense_consultation_id_idx" ON "public"."MedDispense"("consultation_id");

-- CreateIndex
CREATE INDEX "MedInventory_clinic_id_item_name_idx" ON "public"."MedInventory"("clinic_id", "item_name");

-- CreateIndex
CREATE INDEX "Replenishment_med_id_expiry_date_idx" ON "public"."Replenishment"("med_id", "expiry_date");

-- CreateIndex
CREATE INDEX "Users_role_status_idx" ON "public"."Users"("role", "status");

-- CreateIndex
CREATE INDEX "Users_username_idx" ON "public"."Users"("username");

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedInventory" ADD CONSTRAINT "MedInventory_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."Clinic"("clinic_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Replenishment" ADD CONSTRAINT "Replenishment_med_id_fkey" FOREIGN KEY ("med_id") REFERENCES "public"."MedInventory"("med_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorAvailability" ADD CONSTRAINT "DoctorAvailability_doctor_user_id_fkey" FOREIGN KEY ("doctor_user_id") REFERENCES "public"."Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorAvailability" ADD CONSTRAINT "DoctorAvailability_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."Clinic"("clinic_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_patient_user_id_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "public"."Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_doctor_user_id_fkey" FOREIGN KEY ("doctor_user_id") REFERENCES "public"."Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."Clinic"("clinic_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Consultation" ADD CONSTRAINT "Consultation_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."Appointment"("appointment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Consultation" ADD CONSTRAINT "Consultation_doctor_user_id_fkey" FOREIGN KEY ("doctor_user_id") REFERENCES "public"."Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedDispense" ADD CONSTRAINT "MedDispense_med_id_fkey" FOREIGN KEY ("med_id") REFERENCES "public"."MedInventory"("med_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedDispense" ADD CONSTRAINT "MedDispense_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public"."Consultation"("consultation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedCert" ADD CONSTRAINT "MedCert_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public"."Consultation"("consultation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedCert" ADD CONSTRAINT "MedCert_patient_user_id_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "public"."Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedCert" ADD CONSTRAINT "MedCert_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "public"."Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
