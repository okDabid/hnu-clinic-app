import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AppointmentStatus,
  DoctorSpecialization,
  MedcertStatus,
  Role,
} from "@prisma/client";
import { formatManilaDateTime, manilaNow } from "@/lib/time";
import { SimplePdfDocument } from "@/lib/pdf/simple-pdf";
import { PdfCache } from "@/lib/pdf/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function titleCase(value: string | null | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function humanizeEnum(value: string | null | undefined) {
  if (!value) return "";
  return value
    .split("_")
    .map((segment) =>
      segment.length <= 3 && segment === segment.toUpperCase()
        ? segment
        : segment.charAt(0) + segment.slice(1).toLowerCase()
    )
    .join(" ");
}

function computeAge(dateOfBirth?: Date | null, now: Date = new Date()) {
  if (!dateOfBirth) return "";
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return "";

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80) || "certificate";
}

function buildConditionList(rawConditions?: string | null) {
  if (!rawConditions) {
    return [];
  }
  return rawConditions
    .split(/[,;\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(date);
}

type CertificateContext = {
  certificateId: string;
  certificateType: "medical" | "dental";
  issueDate: Date;
  validUntil: Date;
  issueDateDisplay: string;
  patientName: string;
  patientType: string;
  age: string;
  sex: string;
  address: string;
  program: string;
  department: string;
  yearLevel: string;
  clinicName: string;
  consultationDate: string;
  diagnosis: string;
  findings: string;
  reason: string;
  allergies: string[];
  doctorName: string;
  doctorTitle: string;
  licenseNumber: string;
  ptrNumber: string;
};



const CERTIFICATE_CACHE = new PdfCache(1000 * 60 * 60 * 24);

function approximateWidth(text: string, size: number) {
  return text.length * size * 0.5;
}

function sanitize(value?: string, fallback = "Not recorded") {
  return value && value.trim() ? value.trim() : fallback;
}

async function createCertificatePdf(context: CertificateContext) {
  const document = new SimplePdfDocument();
  const page = document.addPage(595.28, 841.89);
  const { width, height } = page.getSize();
  const margin = 48;
  const contentWidth = width - margin * 2;
  let cursorY = height - margin;

  const drawCentered = (
    text: string,
    font: "regular" | "bold",
    size: number,
    spacing = size * 1.6,
  ) => {
    const x = Math.max(margin, (width - approximateWidth(text, size)) / 2);
    page.drawText(text, x, cursorY, font, size);
    cursorY -= spacing;
  };

  const drawRightAligned = (
    text: string,
    y: number,
    font: "regular" | "bold",
    size: number,
  ) => {
    const x = width - margin - approximateWidth(text, size);
    page.drawText(text, x, y, font, size);
  };

  const drawHeading = (text: string) => {
    page.drawText(text.toUpperCase(), margin, cursorY, "bold", 11);
    cursorY -= 18;
  };

  const drawField = (label: string, value?: string) => {
    page.drawText(label.toUpperCase(), margin, cursorY, "bold", 9);
    cursorY =
      page.drawParagraph(
        sanitize(value),
        margin,
        cursorY - 14,
        "regular",
        12,
        contentWidth,
        16,
      ) - 12;
  };

  const introLine =
    context.certificateType === "dental"
      ? `This is to certify that ${context.patientName}, a student of Holy Name University, underwent a dental evaluation at the Holy Name University Highschool Clinic.`
      : `This is to certify that ${context.patientName}, a student of Holy Name University, was examined at the Holy Name University College Clinic.`;

  drawCentered("Holy Name University Clinic", "bold", 18);
  drawCentered("City of Tagbilaran, Bohol", "regular", 11);
  drawCentered(
    (context.certificateType === "dental"
      ? "Dental Certificate"
      : "Medical Certificate").toUpperCase(),
    "bold",
    16,
    28,
  );

  const metaTop = height - margin + 4;
  drawRightAligned(`Certificate ID: ${context.certificateId}`, metaTop, "regular", 10);
  drawRightAligned(`Issued: ${context.issueDateDisplay}`, metaTop - 14, "regular", 10);
  drawRightAligned(`Valid Until: ${formatDateLong(context.validUntil)}`, metaTop - 28, "regular", 10);

  cursorY -= 6;
  page.drawHorizontalRule(margin, cursorY, contentWidth);
  cursorY -= 24;

  cursorY =
    page.drawParagraph(introLine, margin, cursorY, "regular", 12, contentWidth, 16) - 10;

  const reasonParts: string[] = [`Consultation recorded on ${context.consultationDate}.`];
  if (context.reason) {
    reasonParts.push(`Reason for visit: ${context.reason}.`);
  }

  cursorY =
    page.drawParagraph(
      reasonParts.join(" "),
      margin,
      cursorY,
      "regular",
      12,
      contentWidth,
      16,
    ) - 18;

  drawHeading("Patient Information");
  drawField("Patient Name", context.patientName);
  drawField("Patient Type", context.patientType);
  drawField("Age", context.age);
  drawField("Sex", context.sex);
  drawField("Program", context.program);
  drawField("Department", context.department);
  drawField("Year Level", context.yearLevel);
  drawField("Address", context.address);

  drawHeading("Consultation Summary");
  drawField("Clinic", context.clinicName);
  drawField("Consultation Date", context.consultationDate);
  drawField("Diagnosis / Impression", context.diagnosis || "Not recorded");
  drawField(
    "Findings / Recommendations",
    context.findings ||
      (context.certificateType === "dental"
        ? "No dental recommendations were provided."
        : "No medical recommendations were provided."),
  );
  drawField(
    "Allergies",
    context.allergies.length
      ? context.allergies.map((value) => titleCase(value)).join(", ")
      : "No allergies recorded.",
  );
  drawField("Valid Until", formatDateLong(context.validUntil));

  page.drawHorizontalRule(margin, cursorY, contentWidth);
  cursorY -= 24;

  page.drawText(context.doctorName, margin, cursorY, "bold", 12);
  cursorY -= 14;
  page.drawText(context.doctorTitle, margin, cursorY, "regular", 11);
  cursorY -= 14;

  if (context.licenseNumber) {
    page.drawText(`License No.: ${context.licenseNumber}`, margin, cursorY, "regular", 10);
    cursorY -= 12;
  }

  if (context.ptrNumber) {
    page.drawText(`PTR No.: ${context.ptrNumber}`, margin, cursorY, "regular", 10);
    cursorY -= 12;
  }

  page.drawText(
    "Generated by the HNU Clinic information system.",
    margin,
    cursorY - 6,
    "regular",
    9,
  );

  const pdfBytes = await document.save();
  return pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  );
}


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
            specialization: true,
            employee: {
              select: {
                fname: true,
                mname: true,
                lname: true,
                employee_id: true,
                contactno: true,
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

    const specialization = appointment.doctor.specialization;
    if (
      !specialization ||
      ![DoctorSpecialization.Physician, DoctorSpecialization.Dentist].includes(
        specialization
      )
    ) {
      return NextResponse.json(
        { error: "Doctor specialization is required to generate a certificate." },
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

    const doctorTitle =
      specialization === DoctorSpecialization.Dentist
        ? "Attending Dentist"
        : "Attending Physician";

    const issueDateDisplay = formatDateLong(medcert.issue_date);
    const consultationDate =
      formatManilaDateTime(appointment.appointment_timestart) ?? issueDateDisplay;

    const context: CertificateContext = {
      certificateId: medcert.certificate_id,
      certificateType:
        specialization === DoctorSpecialization.Dentist ? "dental" : "medical",
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
      doctorName,
      doctorTitle,
      licenseNumber: "",
      ptrNumber: "",
    };

    const cacheKey = `${context.certificateId}:${context.validUntil.toISOString()}`;
    const cachedPdf = CERTIFICATE_CACHE.get(cacheKey);
    const filename = `${context.certificateType === "dental" ? "dental" : "medical"
      }-certificate-${slugify(patientName)}.pdf`;

    if (cachedPdf) {
      return new Response(cachedPdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    const pdfArrayBuffer = await createCertificatePdf(context);
    CERTIFICATE_CACHE.set(cacheKey, pdfArrayBuffer);

    return new Response(pdfArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("[GET /api/doctor/appointments/:id/certificate]", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
