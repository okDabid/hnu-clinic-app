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

        if (fallback === "Not recorded") {
            return "&nbsp;";
        }

        return `<span class="placeholder">${escapeHtml(fallback)}</span>`;
    };

    const credentialValue = (value?: string) => {
        if (value && value.trim()) {
            return escapeHtml(value);
        }
        return "&nbsp;";
    };

    const isDental = context.certificateType === "dental";
    const heading = isDental ? "DENTAL CERTIFICATE" : "MEDICAL CERTIFICATE";

    const introLine = isDental
        ? `This is to certify that <strong>${escapeHtml(
              context.patientName
          )}</strong>, a student of Holy Name University, underwent a dental evaluation at the Health Services Department.`
        : `This is to certify that <strong>${escapeHtml(
              context.patientName
          )}</strong>, a student of Holy Name University, was examined at the Health Services Department.`;

    const normalizedMedical = context.medicalConditions.map((condition) =>
        condition.toLowerCase()
    );
    const matchedMedicalIndices = new Set<number>();

    const matchesCondition = (keywords: string[]) =>
        keywords.some((keyword) =>
            normalizedMedical.some((condition, index) => {
                if (condition.includes(keyword)) {
                    matchedMedicalIndices.add(index);
                    return true;
                }
                return false;
            })
        );

    const medicalHistoryOptions: { label: string; keywords: string[] }[] = [
        { label: "Asthma", keywords: ["asthma"] },
        {
            label: "Hypertension",
            keywords: ["hypertension", "high blood"],
        },
        { label: "Cancer", keywords: ["cancer"] },
        { label: "Epilepsy", keywords: ["epilepsy", "seizure"] },
        { label: "Diabetes", keywords: ["diabetes"] },
        {
            label: "Heart Disease",
            keywords: ["heart", "cardio", "cardiac"],
        },
        {
            label: "Kidney Disease",
            keywords: ["kidney", "renal"],
        },
        {
            label: "Nervous/Mental Disorder",
            keywords: ["mental", "nervous", "anxiety", "depression", "psychiatric"],
        },
    ];

    const renderCheckbox = (label: string, checked: boolean) => `
        <div class="checkbox">
          <span class="box">${checked ? "☑" : "☐"}</span>
          <span class="text">${escapeHtml(label)}</span>
        </div>
    `;

    const medicalHistoryBoxes = medicalHistoryOptions
        .map((option) => renderCheckbox(option.label, matchesCondition(option.keywords)))
        .join("");

    const remainingMedical = context.medicalConditions
        .filter((_, index) => !matchedMedicalIndices.has(index))
        .map((value) => titleCase(value))
        .join(", ");

    const allergiesList = context.allergies
        .map((value) => titleCase(value))
        .join(", ");

    const impression = placeholder(context.diagnosis, "Not recorded");
    const recommendation = placeholder(
        context.findings,
        isDental
            ? "No dental recommendations were provided."
            : "No medical recommendations were provided."
    );

    const noteParts: string[] = [];
    if (context.reason) {
        noteParts.push(`Reason for visit: ${context.reason}.`);
    }
    noteParts.push(`Consultation recorded on ${context.consultationDate}.`);
    const notes = placeholder(
        noteParts.map((entry) => entry.trim()).join(" "),
        "No additional notes were recorded."
    );

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
        padding: 0.6in 0.65in;
        display: flex;
        flex-direction: column;
      }

      header {
        text-align: center;
        margin-bottom: 12px;
      }

      .institution {
        font-size: 16px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .department {
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .address {
        font-size: 13px;
        margin-top: 2px;
      }

      h1 {
        font-size: 26px;
        margin: 14px 0 0;
        letter-spacing: 0.16em;
      }

      .date-line {
        font-size: 14px;
        display: flex;
        justify-content: flex-end;
        margin-bottom: 12px;
        gap: 6px;
      }

      .underline {
        border-bottom: 1px solid #111827;
        padding: 0 6px 2px;
        min-width: 130px;
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        min-height: 18px;
      }

      .placeholder {
        font-style: italic;
        color: #6b7280;
      }

      section {
        margin-bottom: 16px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 10px;
      }

      .field-line {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        margin-bottom: 6px;
      }

      .field-label {
        width: 160px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 12px;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 6px 12px;
      }

      .field-grid .field-line {
        margin-bottom: 0;
      }

      .checkbox-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px 18px;
        margin-bottom: 10px;
      }

      .checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }

      .checkbox .box {
        font-size: 16px;
        line-height: 1;
      }

      .statement {
        font-size: 14px;
        text-align: justify;
        margin-bottom: 8px;
      }

      .notes {
        min-height: 50px;
      }

      .signature-block {
        margin-top: 28px;
        display: flex;
        justify-content: flex-end;
      }

      .signature {
        text-align: center;
        font-size: 13px;
        min-width: 240px;
      }

      .signature .line {
        border-bottom: 1px solid #111827;
        margin-bottom: 6px;
        padding-bottom: 4px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .signature .credentials {
        margin-top: 12px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 24px;
        justify-items: start;
      }

      .signature .credential {
        text-align: left;
        font-size: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .signature .credential .label {
        font-weight: 600;
        letter-spacing: 0.04em;
      }

      .signature .credential .underline {
        min-width: 150px;
      }

      footer {
        margin-top: auto;
        font-size: 12px;
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
    <main>
      <header>
        <div class="institution">Holy Name University</div>
        <div class="department">Health Services Department</div>
        <div class="address">Tagbilaran City, Bohol</div>
        <h1>${escapeHtml(heading)}</h1>
      </header>

      <div class="date-line">
        <span>Date:</span>
        <span class="underline">${escapeHtml(context.issueDateDisplay)}</span>
      </div>

      <section>
        <div class="section-title">Patient Information</div>
        <div class="field-line">
          <span class="field-label">Name</span>
          <span class="underline">${placeholder(context.patientName)}</span>
        </div>
        <div class="field-line">
          <span class="field-label">Address</span>
          <span class="underline">${placeholder(context.address, "Not provided")}</span>
        </div>
        <div class="field-grid">
          <div class="field-line">
            <span class="field-label">Age</span>
            <span class="underline">${placeholder(context.age, "Not provided")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Sex</span>
            <span class="underline">${placeholder(context.sex, "Not provided")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Program</span>
            <span class="underline">${placeholder(context.program, "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Year Level</span>
            <span class="underline">${placeholder(context.yearLevel, "Not recorded")}</span>
          </div>
        </div>
      </section>

      <section>
        <div class="section-title">Vital Signs</div>
        <div class="field-grid">
          <div class="field-line">
            <span class="field-label">BP</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">HR</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">RR</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Temp</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Weight</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Height</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">SpO₂</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Clinic</span>
            <span class="underline">${placeholder(context.clinicName)}</span>
          </div>
        </div>
      </section>

      <section>
        <div class="section-title">Medical History</div>
        <div class="checkbox-grid">
          ${medicalHistoryBoxes}
        </div>
        <div class="field-line">
          <span class="field-label">Others</span>
          <span class="underline">${placeholder(remainingMedical)}</span>
        </div>
      </section>

      <section>
        <div class="section-title">COVID-19 Vaccination</div>
        <div class="field-line">
          <span class="field-label">Vaccine</span>
          <span class="underline">${placeholder("", "Not recorded")}</span>
        </div>
        <div class="field-grid">
          <div class="field-line">
            <span class="field-label">Dose 1</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Dose 2</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">1st Booster</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">2nd Booster</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
        </div>
      </section>

      <section>
        <div class="section-title">Allergies</div>
        <div class="field-line">
          <span class="field-label">Food / Drug</span>
          <span class="underline">${placeholder(
              allergiesList,
              "No allergies declared"
          )}</span>
        </div>
      </section>

      <section>
        <div class="section-title">Clinical Impression</div>
        <div class="field-line">
          <span class="field-label">Impression</span>
          <span class="underline">${impression}</span>
        </div>
        <div class="field-line">
          <span class="field-label">Recommendation</span>
          <span class="underline">${recommendation}</span>
        </div>
        <div class="field-line notes">
          <span class="field-label">Notes</span>
          <span class="underline">${notes}</span>
        </div>
      </section>

      <p class="statement">${introLine}</p>

      <div class="signature-block">
        <div class="signature">
          <div class="line">${escapeHtml(context.doctorName)}</div>
          <div>${escapeHtml(context.doctorTitle)}</div>
          <div class="credentials">
            <div class="credential">
              <span class="label">License No.</span>
              <span class="underline">${credentialValue(context.licenseNumber)}</span>
            </div>
            <div class="credential">
              <span class="label">PTR No.</span>
              <span class="underline">${credentialValue(context.ptrNumber)}</span>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div>Valid until: ${escapeHtml(formatDateLong(context.validUntil))}</div>
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
            medicalConditions,
            doctorName,
            doctorTitle,
            licenseNumber: doctorEmployee?.employee_id ?? "",
            ptrNumber: doctorEmployee?.contactno ?? "",
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
