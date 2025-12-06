import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { chromium } from "playwright";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  AppointmentStatus,
  DoctorSpecialization,
  MedcertStatus,
  Role,
} from "@prisma/client";
import { formatManilaDateTime, manilaNow } from "@/lib/time";
import { parseMedicalHistory } from "@/lib/medical-history";
import {
  buildConditionList,
  CertificateContext,
  computeAge,
  formatDateLong,
  humanizeEnum,
  renderCertificateHtml,
  slugify,
  titleCase,
} from "@/lib/medical-certificate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.users.findUnique({
      where: { user_id: session.user.id },
      select: { role: true },
    });

    if (!doctor || doctor.role !== Role.DOCTOR) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const appointmentId = id;
    const appointment = await prisma.appointment.findUnique({
      where: { appointment_id: appointmentId },
      select: {
        appointment_id: true,
        patient_user_id: true,
        doctor_user_id: true, // ✅ add this line
        appointment_timestart: true,
        status: true,

        clinic: { select: { clinic_name: true } },
        doctor: {
          select: {
            user_id: true,
            username: true,
            employee: {
              select: {
                fname: true,
                mname: true,
                lname: true,
                employee_id: true,
                contactno: true,
                specialization: true,
              },
            },
          },
        },
        consultation: {
          select: {
            consultation_id: true,
            reason_of_visit: true,
            findings: true,
            diagnosis: true,
            updatedAt: true,
          },
        },
        patient: {
          select: {
            user_id: true,
            username: true,
            student: {
              select: {
                fname: true,
                mname: true,
                lname: true,
                date_of_birth: true,
                gender: true,
                address: true,
                program: true,
                department: true,
                year_level: true,
                allergies: true,
                medical_cond: true,
              },
            },
            employee: {
              select: {
                fname: true,
                mname: true,
                lname: true,
                date_of_birth: true,
                gender: true,
                address: true,
                allergies: true,
                medical_cond: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appointment.doctor_user_id !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (appointment.status !== AppointmentStatus.Completed) {
      return NextResponse.json(
        { error: "Complete the appointment before generating a certificate." },
        { status: 400 }
      );
    }

    if (!appointment.consultation) {
      return NextResponse.json(
        { error: "Consultation notes are required before issuing a certificate." },
        { status: 400 }
      );
    }

    const specialization = appointment.doctor.employee?.specialization;
    if (!specialization) {
      return NextResponse.json(
        { error: "Doctor specialization is required to generate a certificate." },
        { status: 400 }
      );
    }

    if (specialization !== DoctorSpecialization.Physician) {
      return NextResponse.json(
        { error: "Dental certificate issuance is no longer supported." },
        { status: 400 }
      );
    }

    const studentProfile = appointment.patient.student;
    if (!studentProfile) {
      return NextResponse.json(
        { error: "Certificates are currently available for student patients only." },
        { status: 400 }
      );
    }

    const now = manilaNow();
    const validity = new Date(now);
    validity.setUTCFullYear(validity.getUTCFullYear() + 1);

    const existingCert = await prisma.medCert.findFirst({
      where: { consultation_id: appointment.consultation.consultation_id },
    });

    const medcert = existingCert
      ? await prisma.medCert.update({
        where: { certificate_id: existingCert.certificate_id },
        data: {
          issue_date: now,
          valid_until: validity,
          status: MedcertStatus.Valid,
          issued_by_user_id: session.user.id,
        },
      })
      : await prisma.medCert.create({
        data: {
          consultation_id: appointment.consultation.consultation_id,
          patient_user_id: appointment.patient_user_id,
          issued_by_user_id: session.user.id,
          issue_date: now,
          valid_until: validity,
          status: MedcertStatus.Valid,
        },
      });

    await prisma.medCert.updateMany({
      where: {
        patient_user_id: appointment.patient_user_id,
        status: MedcertStatus.Valid,
        valid_until: { lt: now },
      },
      data: { status: MedcertStatus.Expired },
    });

    const medicalHistory = parseMedicalHistory(studentProfile.medical_cond);
    const age = computeAge(studentProfile.date_of_birth, now);
    const sex = studentProfile.gender ? titleCase(studentProfile.gender) : "";
    const program = titleCase(studentProfile.program);
    const department = humanizeEnum(studentProfile.department);
    const yearLevel = humanizeEnum(studentProfile.year_level);
    const allergies = buildConditionList(studentProfile.allergies);
    const patientName = titleCase(
      [studentProfile.fname, studentProfile.mname, studentProfile.lname]
        .filter(Boolean)
        .join(" ") || appointment.patient.username
    );

    const doctorEmployee = appointment.doctor.employee;
    const doctorName = doctorEmployee
      ? titleCase(
        [doctorEmployee.fname, doctorEmployee.mname, doctorEmployee.lname]
          .filter(Boolean)
          .join(" ") || appointment.doctor.username
      )
      : appointment.doctor.username.startsWith("Dr.")
        ? appointment.doctor.username
        : `Dr. ${appointment.doctor.username}`;

    const doctorTitle = "Attending Physician";

    const issueDateDisplay = formatDateLong(medcert.issue_date);
    const consultationDate =
      formatManilaDateTime(appointment.appointment_timestart) ?? issueDateDisplay;

    const context: CertificateContext = {
      certificateId: medcert.certificate_id,
      certificateType: "medical",
      issueDate: medcert.issue_date,
      validUntil: medcert.valid_until,
      issueDateDisplay,
      patientName,
      patientType: "Student",
      age,
      sex,
      address: studentProfile.address ?? "",
      program,
      department,
      yearLevel,
      clinicName: appointment.clinic.clinic_name,
      consultationDate,
      diagnosis: appointment.consultation.diagnosis ?? "",
      findings: appointment.consultation.findings ?? "",
      reason: appointment.consultation.reason_of_visit ?? "",
      allergies,
      medicalHistory,
      doctorName,
      doctorTitle,
      licenseNumber: "",
      ptrNumber: "",
    };

    const html = renderCertificateHtml(context);

    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.emulateMediaType("print");
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0.4in",
          bottom: "0.5in",
          left: "0.5in",
          right: "0.5in",
        },
      });

      const pdfArrayBuffer =
        pdfBuffer instanceof ArrayBuffer
          ? pdfBuffer
          : pdfBuffer.buffer.slice(
            pdfBuffer.byteOffset,
            pdfBuffer.byteOffset + pdfBuffer.byteLength
          );

      const filename = `${context.certificateType === "dental" ? "dental" : "medical"
        }-certificate-${slugify(patientName)}.pdf`;

      return new Response(pdfArrayBuffer as ArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("[GET /api/doctor/appointments/:id/certificate]", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
