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

function renderConditionItems(label: string, items: string[]) {
    if (!items.length) {
        return `<div class="detail-line"><span class="detail-label">${label}:</span><span class="detail-value muted">Not recorded</span></div>`;
    }

    const rendered = items
        .map((item) => `<span class="chip">${escapeHtml(titleCase(item))}</span>`)
        .join(" ");

    return `<div class="detail-line"><span class="detail-label">${label}:</span><span class="detail-value">${rendered}</span></div>`;
}

function renderCertificateHtml(context: CertificateContext) {
    const heading =
        context.certificateType === "dental"
            ? "Dental Certificate"
            : "Medical Certificate";

    const introLine =
        context.certificateType === "dental"
            ? `This is to certify that <strong>${escapeHtml(
                context.patientName
            )}</strong>, a student of Holy Name University, underwent a dental evaluation at the Health Services Department.`
            : `This is to certify that <strong>${escapeHtml(
                context.patientName
            )}</strong>, a student of Holy Name University, was examined at the Health Services Department.`;

    const assessmentLine = context.diagnosis
        ? `The assessment was noted as <strong>${escapeHtml(
            context.diagnosis
        )}</strong>.`
        : `The assessment findings are on record with the attending clinician.`;

    const recommendationLine = context.findings
        ? escapeHtml(context.findings)
        : "No additional remarks were recorded.";

    const reasonLine = context.reason
        ? `Reason for visit: ${escapeHtml(context.reason)}.`
        : "Reason for visit: Not specified.";

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
        min-height: 11.69in;
        margin: 0 auto;
        padding: 0.75in 0.8in;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      header {
        text-align: center;
        border-bottom: 2px solid #111827;
        padding-bottom: 18px;
        margin-bottom: 12px;
      }

      .institution {
        font-size: 16px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        margin-bottom: 4px;
      }

      .department {
        font-size: 14px;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      h1 {
        font-size: 28px;
        margin: 12px 0 4px;
        letter-spacing: 0.1em;
      }

      .meta-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        margin-top: 4px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin: 16px 0 8px;
      }

      .details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px 18px;
        font-size: 13px;
      }

      .detail-line {
        display: flex;
        gap: 6px;
        align-items: baseline;
      }

      .detail-label {
        font-weight: 600;
        min-width: 110px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 11px;
        color: #374151;
      }

      .detail-value {
        flex: 1;
        font-size: 13px;
      }

      .muted {
        color: #6b7280;
        font-style: italic;
      }

      .chip {
        display: inline-block;
        border: 1px solid #d1d5db;
        border-radius: 999px;
        padding: 2px 10px;
        font-size: 11px;
        margin-right: 6px;
        margin-bottom: 4px;
      }

      .statement {
        font-size: 14px;
        line-height: 1.6;
        text-align: justify;
      }

      .statement strong {
        font-weight: 700;
      }

      .signature-block {
        margin-top: 36px;
        display: flex;
        justify-content: flex-end;
      }

      .signature {
        text-align: center;
        font-size: 13px;
      }

      .signature .line {
        border-bottom: 1px solid #111827;
        margin-bottom: 6px;
        padding-bottom: 4px;
        font-weight: 600;
      }

      footer {
        margin-top: auto;
        font-size: 11px;
        color: #6b7280;
        display: flex;
        justify-content: space-between;
      }

      .certificate-id {
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
        <h1>${escapeHtml(heading)}</h1>
        <div class="meta-row">
          <span>Date Issued: ${escapeHtml(context.issueDateDisplay)}</span>
          <span>Clinic: ${escapeHtml(context.clinicName)}</span>
        </div>
      </header>

      <section>
        <div class="section-title">Patient Information</div>
        <div class="details">
          <div class="detail-line"><span class="detail-label">Name:</span><span class="detail-value">${escapeHtml(
        context.patientName
    )}</span></div>
          <div class="detail-line"><span class="detail-label">Age:</span><span class="detail-value">${escapeHtml(
        context.age || "Not provided"
    )}</span></div>
          <div class="detail-line"><span class="detail-label">Sex:</span><span class="detail-value">${escapeHtml(
        context.sex || "Not provided"
    )}</span></div>
          <div class="detail-line"><span class="detail-label">Student status:</span><span class="detail-value">${escapeHtml(
        context.patientType
    )}</span></div>
          <div class="detail-line"><span class="detail-label">Program:</span><span class="detail-value">${escapeHtml(
        context.program || "Not recorded"
    )}</span></div>
          <div class="detail-line"><span class="detail-label">Year level:</span><span class="detail-value">${escapeHtml(
        context.yearLevel || "Not recorded"
    )}</span></div>
          <div class="detail-line"><span class="detail-label">Department:</span><span class="detail-value">${escapeHtml(
        context.department || "Not recorded"
    )}</span></div>
          <div class="detail-line"><span class="detail-label">Address:</span><span class="detail-value">${escapeHtml(
        context.address || "Not recorded"
    )}</span></div>
        </div>
      </section>

      <section>
        <div class="section-title">Consultation Summary</div>
        <p class="statement">${introLine}</p>
        <p class="statement">${assessmentLine}</p>
        <p class="statement">${reasonLine}</p>
        <p class="statement">Doctor's remarks: ${recommendationLine}</p>
        <p class="statement">Consultation recorded on ${escapeHtml(
        context.consultationDate
    )}.</p>
      </section>

      <section>
        <div class="section-title">Health Declarations</div>
        ${renderConditionItems("Allergies", context.allergies)}
        ${renderConditionItems("Medical Conditions", context.medicalConditions)}
      </section>

      <div class="signature-block">
        <div class="signature">
          <div class="line">${escapeHtml(context.doctorName)}</div>
          <div>${escapeHtml(context.doctorTitle)}</div>
          <div>License No.: ${escapeHtml(context.licenseNumber || "Not provided")}</div>
          <div>PTR No.: ${escapeHtml(context.ptrNumber || "Not provided")}</div>
        </div>
      </div>

      <footer>
        <span>Valid until: ${escapeHtml(formatDateLong(context.validUntil))}</span>
        <span class="certificate-id">Certificate ID: ${escapeHtml(
        context.certificateId
    )}</span>
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
        validity.setUTCDate(validity.getUTCDate() + 3);

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
