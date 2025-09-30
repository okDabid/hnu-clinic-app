-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('Male', 'Female');

-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "public"."MedcertStatus" AS ENUM ('Valid', 'Expired');

-- CreateTable
CREATE TABLE "public"."Clinic" (
    "clinic_id" TEXT NOT NULL,
    "clinic_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clinic_location" TEXT NOT NULL,
    "clinic_contactno" TEXT NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("clinic_id")
);

-- CreateTable
CREATE TABLE "public"."Users" (
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "public"."AccountStatus" NOT NULL DEFAULT 'Active',

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "stud_user_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fname" TEXT NOT NULL,
    "mname" TEXT,
    "lname" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "department" TEXT,
    "program" TEXT,
    "specialization" TEXT,
    "year_level" TEXT,
    "contactno" TEXT,
    "address" TEXT,
    "bloodtype" TEXT,
    "allergies" TEXT,
    "medical_cond" TEXT,
    "emergencyco_name" TEXT,
    "emergencyco_num" TEXT,
    "emergencyco_relation" TEXT,
    "status" "public"."AccountStatus" NOT NULL DEFAULT 'Active',

    CONSTRAINT "Student_pkey" PRIMARY KEY ("stud_user_id")
);

-- CreateTable
CREATE TABLE "public"."Employee" (
    "emp_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "fname" TEXT NOT NULL,
    "mname" TEXT,
    "lname" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "contactno" TEXT,
    "address" TEXT,
    "bloodtype" TEXT,
    "allergies" TEXT,
    "medical_cond" TEXT,
    "emergencyco_name" TEXT,
    "emergencyco_num" TEXT,
    "emergencyco_relation" TEXT,
    "status" "public"."AccountStatus" NOT NULL DEFAULT 'Active',

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("emp_id")
);

-- CreateTable
CREATE TABLE "public"."MedInventory" (
    "med_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_type" TEXT,

    CONSTRAINT "MedInventory_pkey" PRIMARY KEY ("med_id")
);

-- CreateTable
CREATE TABLE "public"."Replenishment" (
    "replenishment_id" TEXT NOT NULL,
    "med_id" TEXT NOT NULL,
    "quantity_added" INTEGER NOT NULL,
    "date_received" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Replenishment_pkey" PRIMARY KEY ("replenishment_id")
);

-- CreateTable
CREATE TABLE "public"."DoctorAvailability" (
    "availability_id" TEXT NOT NULL,
    "doctor_user_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "available_date" TIMESTAMP(3) NOT NULL,
    "available_timestart" TIMESTAMP(3) NOT NULL,
    "available_timeend" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY ("availability_id")
);

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "appointment_id" TEXT NOT NULL,
    "patient_user_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "doctor_user_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "appointment_date" TIMESTAMP(3) NOT NULL,
    "appointment_timestart" TIMESTAMP(3) NOT NULL,
    "appointment_timeend" TIMESTAMP(3) NOT NULL,
    "service_type" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("appointment_id")
);

-- CreateTable
CREATE TABLE "public"."Consultation" (
    "consultation_id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "doctor_user_id" TEXT NOT NULL,
    "nurse_user_id" TEXT,
    "reason_of_visit" TEXT,
    "findings" TEXT,
    "diagnosis" TEXT,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("consultation_id")
);

-- CreateTable
CREATE TABLE "public"."MedDispense" (
    "dispense_id" TEXT NOT NULL,
    "med_id" TEXT NOT NULL,
    "consultation_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "MedDispense_pkey" PRIMARY KEY ("dispense_id")
);

-- CreateTable
CREATE TABLE "public"."MedCert" (
    "certificate_id" TEXT NOT NULL,
    "consultation_id" TEXT NOT NULL,
    "patient_user_id" TEXT NOT NULL,
    "issued_by_user_id" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "status" "public"."MedcertStatus" NOT NULL,

    CONSTRAINT "MedCert_pkey" PRIMARY KEY ("certificate_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_slug_key" ON "public"."Clinic"("slug");

-- CreateIndex
CREATE INDEX "Clinic_slug_idx" ON "public"."Clinic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "public"."Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Student_user_id_key" ON "public"."Student"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_student_id_key" ON "public"."Student"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_user_id_key" ON "public"."Employee"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employee_id_key" ON "public"."Employee"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_appointment_id_key" ON "public"."Consultation"("appointment_id");

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedInventory" ADD CONSTRAINT "MedInventory_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."Clinic"("clinic_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Replenishment" ADD CONSTRAINT "Replenishment_med_id_fkey" FOREIGN KEY ("med_id") REFERENCES "public"."MedInventory"("med_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorAvailability" ADD CONSTRAINT "DoctorAvailability_doctor_user_id_fkey" FOREIGN KEY ("doctor_user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorAvailability" ADD CONSTRAINT "DoctorAvailability_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."Clinic"("clinic_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_patient_user_id_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_doctor_user_id_fkey" FOREIGN KEY ("doctor_user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."Clinic"("clinic_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Consultation" ADD CONSTRAINT "Consultation_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."Appointment"("appointment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Consultation" ADD CONSTRAINT "Consultation_doctor_user_id_fkey" FOREIGN KEY ("doctor_user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Consultation" ADD CONSTRAINT "Consultation_nurse_user_id_fkey" FOREIGN KEY ("nurse_user_id") REFERENCES "public"."Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedDispense" ADD CONSTRAINT "MedDispense_med_id_fkey" FOREIGN KEY ("med_id") REFERENCES "public"."MedInventory"("med_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedDispense" ADD CONSTRAINT "MedDispense_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public"."Consultation"("consultation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedCert" ADD CONSTRAINT "MedCert_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public"."Consultation"("consultation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedCert" ADD CONSTRAINT "MedCert_patient_user_id_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedCert" ADD CONSTRAINT "MedCert_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
