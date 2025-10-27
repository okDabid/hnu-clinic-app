import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AppointmentStatus,
  DoctorSpecialization,
  MedcertStatus,
  Role,
} from "@prisma/client";
import { formatManilaDateTime, manilaNow } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  medicalConditions: string[];
  vitals: {
    weight?: string;
    height?: string;
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    oxygenSaturation?: string;
  };
  vaccination: {
    vaccine?: string;
    dose1?: string;
    dose2?: string;
    booster1?: string;
    booster2?: string;
  };
  doctorName: string;
  doctorTitle: string;
  licenseNumber: string;
  ptrNumber: string;
};

function renderCertificateHtml(context: CertificateContext) {
  const placeholder = (value?: string, fallback = "Not recorded") => {
    if (value && value.trim()) {
      return escapeHtml(value);
    }

    return `<span class="placeholder">${escapeHtml(fallback)}</span>`;
  };

  const credentialValue = (value?: string) =>
    placeholder(value, "Not provided");

  const isDental = context.certificateType === "dental";
  const heading = isDental ? "DENTAL CERTIFICATE" : "MEDICAL CERTIFICATE";

  const defaultClinic = isDental ? "Highschool Clinic" : "College Clinic";
  const clinicDisplay = context.clinicName?.trim()
    ? context.clinicName
    : defaultClinic;

  const certificateClasses = isDental
    ? "certificate dental"
    : "certificate medical";

  const introLine = isDental
    ? `This is to certify that <strong>${escapeHtml(
        context.patientName
      )}</strong>, a student of Holy Name University, underwent a dental evaluation at the Holy Name University ${escapeHtml(
        clinicDisplay
      )}.`
    : `This is to certify that <strong>${escapeHtml(
        context.patientName
      )}</strong>, a student of Holy Name University, was examined at the Holy Name University ${escapeHtml(
        clinicDisplay
      )}.`;

  const medicalHistoryOptions = [
    "Asthma",
    "Hypertension",
    "Cancer",
    "Epilepsy",
    "Diabetes",
    "Heart Disease",
    "Kidney Disease",
    "Nervous/Mental Disorder",
  ];

  const normalizeCondition = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "");

  const normalizedOptions = medicalHistoryOptions.map((label) => ({
    label,
    key: normalizeCondition(label),
  }));

  const matchedConditions = new Set<string>();
  const otherConditions: string[] = [];

  for (const raw of context.medicalConditions) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const normalized = normalizeCondition(trimmed);
    const match = normalizedOptions.find(
      (option) =>
        normalized === option.key ||
        normalized.includes(option.key) ||
        option.key.includes(normalized)
    );

    if (match) {
      matchedConditions.add(match.label);
    } else {
      otherConditions.push(titleCase(trimmed));
    }
  }

  const uniqueOtherConditions = Array.from(
    new Map(otherConditions.map((value) => [value.toLowerCase(), value])).values()
  );

  const medicalHistoryHtml = medicalHistoryOptions
    .map((label) => {
      const isChecked = matchedConditions.has(label);
      return `
          <div class="checkbox${isChecked ? " checked" : ""}">
            <span class="box" aria-hidden="true"></span>
            <span class="text">${escapeHtml(label)}</span>
          </div>
      `;
    })
    .join("");

  const renderInfoItem = (
    label: string,
    value?: string,
    fallback = "Not recorded",
    options: { full?: boolean; compact?: boolean } = {}
  ) => {
    const classes = ["info-item"];
    if (options.full) classes.push("full");
    if (options.compact) classes.push("compact");

    return `
      <div class="${classes.join(" ")}">
        <span class="item-label">${escapeHtml(label)}</span>
        <span class="item-value">${placeholder(value, fallback)}</span>
      </div>
    `;
  };

  const renderStatCard = (
    label: string,
    value?: string,
    fallback = "Not recorded"
  ) => `
      <div class="stat-card">
        <span class="card-label">${escapeHtml(label)}</span>
        <span class="card-value">${placeholder(value, fallback)}</span>
      </div>
    `;

  const patientInfoItems: {
    label: string;
    value?: string;
    fallback?: string;
    full?: boolean;
    compact?: boolean;
  }[] = [
    { label: "Name", value: context.patientName, fallback: "Not recorded", full: true },
    { label: "Address", value: context.address, fallback: "Not provided", full: true },
    { label: "Patient Type", value: context.patientType, fallback: "Not recorded" },
    { label: "Age", value: context.age, fallback: "Not provided" },
    { label: "Sex", value: context.sex, fallback: "Not provided" },
    { label: "Program", value: context.program, fallback: "Not recorded" },
    { label: "Year Level", value: context.yearLevel, fallback: "Not recorded" },
  ];

  patientInfoItems.push({
    label: "Department",
    value: context.department,
    fallback: "Not recorded",
  });

  const patientInfoHtml = patientInfoItems
    .map((item) =>
      renderInfoItem(
        item.label,
        item.value,
        item.fallback,
        { full: item.full, compact: item.compact }
      )
    )
    .join("");

  const vitalCards: { label: string; value?: string; fallback?: string }[] = [
    { label: "Weight", value: context.vitals.weight },
    { label: "Height", value: context.vitals.height },
    { label: "BP", value: context.vitals.bloodPressure },
    { label: "HR", value: context.vitals.heartRate },
    { label: "SpO₂", value: context.vitals.oxygenSaturation },
    { label: "Temp", value: context.vitals.temperature },
    { label: "Clinic", value: clinicDisplay },
  ];

  const vitalSignsHtml = vitalCards
    .map((card) => renderStatCard(card.label, card.value, card.fallback))
    .join("");

  const vaccinationCards: { label: string; value?: string; fallback?: string }[] = [
    { label: "Vaccine", value: context.vaccination.vaccine },
    { label: "Dose 1", value: context.vaccination.dose1 },
    { label: "Dose 2", value: context.vaccination.dose2 },
    { label: "1st Booster", value: context.vaccination.booster1 },
    { label: "2nd Booster", value: context.vaccination.booster2 },
  ];

  const vaccinationHtml = vaccinationCards
    .map((card) => renderStatCard(card.label, card.value, card.fallback))
    .join("");

  const allergiesList = context.allergies
    .map((value) => titleCase(value))
    .filter(Boolean)
    .join(", ");

  const recommendationFallback = isDental
    ? "No dental recommendations were provided."
    : "No medical recommendations were provided.";

  const noteParts: string[] = [];
  if (context.reason) {
    noteParts.push(`Reason for visit: ${context.reason}.`);
  }
  if (context.consultationDate) {
    noteParts.push(`Consultation recorded on ${context.consultationDate}.`);
  }

  const notesText = noteParts.map((entry) => entry.trim()).join(" ");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(heading)}</title>
    <style>
      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: "Times New Roman", "Georgia", serif;
        background: #ffffff;
        color: #111827;
      }

      main {
        width: 8.27in;
        min-height: 11in;
        margin: 0 auto;
        padding: 0.45in 0.6in 0.5in;
        display: flex;
        flex-direction: column;
      }

      header {
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 18px;
      }

      .institution {
        font-size: 16px;
        font-weight: 600;
      }

      .department {
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.12em;
      }

      .address {
        font-size: 12px;
        margin-top: 2px;
        letter-spacing: 0.04em;
      }

      h1 {
        font-size: 22px;
        letter-spacing: 0.18em;
        margin: 12px 0 0;
      }

      .meta {
        font-size: 12.5px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-bottom: 14px;
        align-items: center;
      }

      .meta-label {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-weight: 600;
      }

      .meta-value {
        min-width: 150px;
        border-bottom: 1px solid #111827;
        padding-bottom: 2px;
        text-align: center;
        font-weight: 500;
      }

      .section {
        margin-bottom: 18px;
      }

      .section-title {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        margin-bottom: 8px;
        color: #111827;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 8px 16px;
      }

      .info-grid.single {
        grid-template-columns: minmax(0, 1fr);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12.4px;
        min-height: 48px;
      }

      .info-item.full {
        grid-column: 1 / -1;
      }

      .info-item.compact {
        min-height: 0;
      }

      .item-label {
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 10px;
        color: #4b5563;
      }

      .item-value {
        font-weight: 500;
        color: #111827;
        min-height: 18px;
        display: inline-flex;
        align-items: center;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 10px 16px;
      }

      .stat-card {
        border: 1px solid #d1d5db;
        border-radius: 4px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 66px;
      }

      .stat-card .card-label {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 9.5px;
        color: #4b5563;
      }

      .stat-card .card-value {
        font-size: 12.8px;
        font-weight: 600;
        color: #111827;
      }

      .placeholder {
        font-style: italic;
        color: #6b7280;
        font-weight: normal;
      }

      .checkbox-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 6px 16px;
        margin-bottom: 10px;
      }

      .checkbox {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12.4px;
      }

      .checkbox .box {
        width: 12px;
        height: 12px;
        border: 1px solid #111827;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .checkbox.checked .box::after {
        content: "✔";
        font-size: 10px;
        color: #111827;
      }

      .checkbox .text {
        letter-spacing: 0.02em;
      }

      .statement {
        font-size: 13.2px;
        text-align: justify;
        line-height: 1.55;
        margin: 18px 0 14px;
      }

      .signature-block {
        margin-top: 24px;
        display: flex;
        justify-content: flex-end;
      }

      .signature {
        text-align: center;
        font-size: 12px;
        min-width: 240px;
      }

      .signature .line {
        border-bottom: 1px solid #111827;
        margin-bottom: 4px;
        padding-bottom: 3px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .signature .title {
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .credentials {
        margin-top: 8px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px 14px;
        font-size: 10.4px;
      }

      .credential {
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .credential .label {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
        font-size: 9.6px;
        color: #4b5563;
      }

      .credential .value {
        border-bottom: 1px solid #111827;
        min-height: 18px;
        display: flex;
        align-items: center;
        padding-bottom: 2px;
        font-weight: 500;
      }

      footer {
        margin-top: auto;
        font-size: 10.6px;
        color: #374151;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      footer .certificate-id {
        font-family: "Courier New", monospace;
        letter-spacing: 0.08em;
      }
    </style>
  </head>
  <body>
    <main class="${certificateClasses}">
      <header>
        <div class="institution">Holy Name University</div>
        <div class="department">Health Services Department</div>
        <div class="address">Tagbilaran City, Bohol</div>
        <h1>${escapeHtml(heading)}</h1>
      </header>

      <div class="meta">
        <span class="meta-label">Date</span>
        <span class="meta-value">${escapeHtml(context.issueDateDisplay)}</span>
      </div>

      <section class="section">
        <div class="section-title">Patient Information</div>
        <div class="info-grid">
          ${patientInfoHtml}
        </div>
      </section>

      <section class="section">
        <div class="section-title">Vital Signs</div>
        <div class="stats-grid">
          ${vitalSignsHtml}
        </div>
      </section>

      <section class="section">
        <div class="section-title">Medical History</div>
        <div class="checkbox-grid">
          ${medicalHistoryHtml}
        </div>
        <div class="info-grid single">
          ${renderInfoItem(
            "Others",
            uniqueOtherConditions.join(", "),
            "None declared",
            { full: true, compact: true }
          )}
        </div>
      </section>

      <section class="section">
        <div class="section-title">COVID-19 Vaccination</div>
        <div class="stats-grid">
          ${vaccinationHtml}
        </div>
      </section>

      <section class="section">
        <div class="section-title">Allergies</div>
        <div class="info-grid single">
          ${renderInfoItem(
            "Food / Drug",
            allergiesList,
            "None declared",
            { full: true, compact: true }
          )}
        </div>
      </section>

      <section class="section">
        <div class="section-title">Clinical Impression</div>
        <div class="info-grid single">
          ${renderInfoItem(
            "Impression",
            context.diagnosis,
            "Not recorded",
            { full: true }
          )}
          ${renderInfoItem(
            "Recommendation",
            context.findings,
            recommendationFallback,
            { full: true }
          )}
          ${renderInfoItem(
            "Notes",
            notesText,
            "No additional notes were recorded.",
            { full: true }
          )}
        </div>
      </section>

      <p class="statement">${introLine}</p>

      <div class="signature-block">
        <div class="signature">
          <div class="line">${escapeHtml(context.doctorName)}</div>
          <div class="title">${escapeHtml(context.doctorTitle)}</div>
          <div class="credentials">
            <div class="credential">
              <span class="label">License No.</span>
              <span class="value">${credentialValue(context.licenseNumber)}</span>
            </div>
            <div class="credential">
              <span class="label">PTR No.</span>
              <span class="value">${credentialValue(context.ptrNumber)}</span>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div>Valid until ${escapeHtml(formatDateLong(context.validUntil))}.</div>
        <div class="certificate-id">Certificate ID: ${escapeHtml(
          context.certificateId
        )}</div>
        <div>
          This certificate is issued for any school-related activity and is valid for one (1) year from the date of issuance.
        </div>
      </footer>
    </main>
  </body>
</html>`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const isLocal = !process.env.AWS_REGION && !process.env.VERCEL;
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
    const medicalConditions = buildConditionList(studentProfile.medical_cond);
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
      formatManilaDateTime(
        appointment.consultation.updatedAt ?? appointment.appointment_timestart
      ) || issueDateDisplay;

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
      clinicName: appointment.clinic?.clinic_name ?? "",
      consultationDate,
      diagnosis: appointment.consultation.diagnosis ?? "",
      findings: appointment.consultation.findings ?? "",
      reason: appointment.consultation.reason_of_visit ?? "",
      allergies,
      medicalConditions,
      vitals: {},
      vaccination: {},
      doctorName,
      doctorTitle,
      licenseNumber: "",
      ptrNumber: "",
    };

    const html = renderCertificateHtml(context);

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath: isLocal
        ? process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : await chromium.executablePath(),
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
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
          "Content-Disposition": `attachment; filename="${filename}"`,
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
