import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { manilaNow, PH_TIME_ZONE } from "@/lib/time";
import { DoctorSpecialization, Gender, YearLevel } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YEAR_LEVEL_LABELS: Record<YearLevel, string> = {
    [YearLevel.FIRST_YEAR]: "1st Year",
    [YearLevel.SECOND_YEAR]: "2nd Year",
    [YearLevel.THIRD_YEAR]: "3rd Year",
    [YearLevel.FOURTH_YEAR]: "4th Year",
    [YearLevel.FIFTH_YEAR]: "5th Year",
    [YearLevel.KINDERGARTEN]: "Kindergarten",
    [YearLevel.ELEMENTARY]: "Elementary",
    [YearLevel.JUNIOR_HIGH]: "Junior High",
    [YearLevel.SENIOR_HIGH]: "Senior High",
};

type DisplayValue = {
    html: string;
    muted: boolean;
};

type CertificateKind = "medical" | "dental";

type CertificateData = {
    issueDate: string;
    clinicName: string;
    patientName: string;
    studentId: string | null;
    address: string | null;
    age: string | null;
    gender: string | null;
    program: string | null;
    yearLevel: string | null;
    appointmentDate: string | null;
    appointmentTime: string | null;
    reason: string | null;
    findings: string | null;
    diagnosis: string | null;
    medicalHistory: string | null;
    allergies: string | null;
    consultationUpdated: string | null;
    doctorName: string;
    doctorTitle: string;
};

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (char) => {
        switch (char) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case '"':
                return "&quot;";
            case "'":
                return "&#39;";
            default:
                return char;
        }
    });
}

function formatDisplay(
    value: string | null | undefined,
    fallback: string,
    { multiline = false }: { multiline?: boolean } = {}
): DisplayValue {
    const trimmed = typeof value === "string" ? value.trim() : "";
    const useFallback = trimmed.length === 0;
    const raw = useFallback ? fallback : trimmed;
    const escaped = escapeHtml(raw);
    return {
        html: multiline ? escaped.replace(/\r?\n/g, "<br/>") : escaped,
        muted: useFallback,
    };
}

function formatGender(value: Gender | null | undefined): string | null {
    if (!value) return null;
    return value === Gender.Male ? "Male" : value === Gender.Female ? "Female" : value;
}

function computeAge(birthDate: Date | null | undefined, reference: Date): string | null {
    if (!birthDate) return null;
    let age = reference.getUTCFullYear() - birthDate.getUTCFullYear();
    const refMonth = reference.getUTCMonth();
    const refDay = reference.getUTCDate();
    const birthMonth = birthDate.getUTCMonth();
    const birthDay = birthDate.getUTCDate();

    if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
        age -= 1;
    }

    if (Number.isNaN(age) || age < 0) return null;
    return age.toString();
}

function formatDateLong(value: Date | null | undefined): string | null {
    if (!value) return null;
    return new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: PH_TIME_ZONE }).format(value);
}

function formatTimeShort(value: Date | null | undefined): string | null {
    if (!value) return null;
    return new Intl.DateTimeFormat("en-PH", { timeStyle: "short", timeZone: PH_TIME_ZONE }).format(value);
}

function buildFullName(
    data?: { fname: string | null; mname: string | null; lname: string | null } | null,
    fallback: string = ""
) {
    if (!data) return fallback;
    const parts = [data.fname, data.mname, data.lname].filter((part) => part && part.trim().length > 0) as string[];
    if (parts.length === 0) return fallback;
    return parts.join(" ");
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .replace(/-{2,}/g, "-")
        .slice(0, 64) || "certificate";
}

function buildSummary(kind: CertificateKind, data: CertificateData) {
    const courseParts = [data.program, data.yearLevel].filter(Boolean);
    const provider = kind === "medical" ? "clinic physician" : "clinic dentist";
    const clinic = data.clinicName || "Holy Name University Clinic";

    const fragments = [
        `This is to certify that ${data.patientName}`,
        courseParts.length ? `(${courseParts.join(", ")})` : "",
        data.appointmentDate ? `was examined on ${data.appointmentDate}` : "was examined",
        data.appointmentTime ? `at ${data.appointmentTime}` : "",
        `at the ${clinic} by the ${provider}.`,
    ].filter(Boolean);

    return fragments.join(" ").replace(/\s+/g, " ").trim();
}

function createCertificateHtml(kind: CertificateKind, data: CertificateData) {
    const title = kind === "medical" ? "Medical Certificate" : "Dental Certificate";
    const summary = formatDisplay(buildSummary(kind, data), "", { multiline: false });
    const address = formatDisplay(data.address, "Not provided", { multiline: true });
    const program = formatDisplay(data.program, "Not recorded");
    const yearLevel = formatDisplay(data.yearLevel, "Not recorded");
    const studentId = formatDisplay(data.studentId, "Not recorded");
    const gender = formatDisplay(data.gender, "Not recorded");
    const age = formatDisplay(data.age, "Not recorded");
    const appointmentDate = formatDisplay(data.appointmentDate, "Not recorded");
    const appointmentTime = formatDisplay(data.appointmentTime, "Not recorded");
    const reason = formatDisplay(data.reason, "Not specified", { multiline: true });
    const findings = formatDisplay(data.findings, "Not documented", { multiline: true });
    const diagnosis = formatDisplay(data.diagnosis, "Not documented", { multiline: true });
    const medicalHistory = formatDisplay(data.medicalHistory, "None reported", { multiline: true });
    const allergies = formatDisplay(data.allergies, "None reported", { multiline: true });
    const documented = formatDisplay(data.consultationUpdated, "Not available");

    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charSet="utf-8" />
        <title>${title}</title>
        <style>
            :root {
                color-scheme: light;
                font-family: "Inter", "Segoe UI", sans-serif;
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                padding: 32px 16px;
                background: #f1f5f9;
                color: #0f172a;
            }

            main {
                max-width: 820px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 28px;
                border: 1px solid #dbeafe;
                box-shadow: 0 22px 45px rgba(15, 23, 42, 0.08);
                overflow: hidden;
            }

            .accent {
                height: 10px;
                background: linear-gradient(90deg, #0ea5e9, #10b981);
            }

            header {
                padding: 32px 40px 24px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 24px;
                background: #ffffff;
            }

            .brand {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .brand span:first-child {
                font-size: 20px;
                font-weight: 700;
                color: #0f172a;
            }

            .brand span:last-child {
                font-size: 14px;
                color: #475569;
                letter-spacing: 0.06em;
                text-transform: uppercase;
            }

            .issued {
                text-align: right;
            }

            .issued .label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #64748b;
            }

            .issued .value {
                display: block;
                margin-top: 6px;
                font-size: 15px;
                font-weight: 600;
                color: #0f172a;
            }

            .title {
                padding: 0 40px 16px;
            }

            .title h1 {
                margin: 0;
                font-size: 30px;
                color: #0f172a;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }

            .summary {
                padding: 0 40px 32px;
            }

            .summary p {
                margin: 0;
                font-size: 16px;
                line-height: 1.6;
                color: #1f2937;
            }

            .section {
                padding: 0 40px 32px;
            }

            .section h2 {
                margin: 0 0 16px;
                font-size: 17px;
                font-weight: 700;
                color: #0369a1;
                text-transform: uppercase;
                letter-spacing: 0.06em;
            }

            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 16px;
            }

            .info-item {
                padding: 14px 18px;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                background: #f8fafc;
                min-height: 82px;
            }

            .info-item .label {
                display: block;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.08em;
                color: #64748b;
                text-transform: uppercase;
            }

            .info-item .value {
                display: block;
                margin-top: 8px;
                font-size: 15px;
                font-weight: 600;
                color: #0f172a;
                line-height: 1.5;
                word-break: break-word;
            }

            .info-item .value.muted {
                color: #94a3b8;
                font-weight: 500;
            }

            .notes {
                padding: 20px 24px;
                border-radius: 18px;
                background: #eff6ff;
                border: 1px solid rgba(14, 165, 233, 0.2);
                line-height: 1.5;
                color: #1f2937;
            }

            .signature {
                padding: 32px 40px 48px;
                display: flex;
                justify-content: flex-end;
            }

            .signature .block {
                width: 320px;
                text-align: center;
            }

            .signature .line {
                display: block;
                height: 1px;
                background: #0ea5e9;
                margin-bottom: 10px;
            }

            .signature .name {
                font-size: 16px;
                font-weight: 600;
                color: #0f172a;
            }

            .signature .title {
                font-size: 13px;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }

            footer {
                padding: 0 40px 40px;
                font-size: 12px;
                color: #64748b;
                line-height: 1.5;
            }

            @page {
                size: A4;
                margin: 22mm;
            }
        </style>
    </head>
    <body>
        <main>
            <div class="accent"></div>
            <header>
                <div class="brand">
                    <span>Holy Name University</span>
                    <span>Health Services Department</span>
                </div>
                <div class="issued">
                    <span class="label">Issued on</span>
                    <span class="value">${escapeHtml(data.issueDate)}</span>
                </div>
            </header>
            <div class="title">
                <h1>${title}</h1>
            </div>
            <div class="summary">
                <p>${summary.html}</p>
            </div>
            <section class="section">
                <h2>Patient information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Full name</span>
                        <span class="value">${escapeHtml(data.patientName)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Student ID</span>
                        <span class="value${studentId.muted ? " muted" : ""}">${studentId.html}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Program</span>
                        <span class="value${program.muted ? " muted" : ""}">${program.html}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Year level</span>
                        <span class="value${yearLevel.muted ? " muted" : ""}">${yearLevel.html}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Age</span>
                        <span class="value${age.muted ? " muted" : ""}">${age.html}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Sex</span>
                        <span class="value${gender.muted ? " muted" : ""}">${gender.html}</span>
                    </div>
                    <div class="info-item" style="grid-column: 1 / -1;">
                        <span class="label">Home address</span>
                        <span class="value${address.muted ? " muted" : ""}">${address.html}</span>
                    </div>
                </div>
            </section>
            <section class="section">
                <h2>Consultation summary</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Visit date</span>
                        <span class="value${appointmentDate.muted ? " muted" : ""}">${appointmentDate.html}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Visit time</span>
                        <span class="value${appointmentTime.muted ? " muted" : ""}">${appointmentTime.html}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Reason for visit</span>
                        <span class="value${reason.muted ? " muted" : ""}">${reason.html}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Findings</span>
                        <span class="value${findings.muted ? " muted" : ""}">${findings.html}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Diagnosis</span>
                        <span class="value${diagnosis.muted ? " muted" : ""}">${diagnosis.html}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Documented on</span>
                        <span class="value${documented.muted ? " muted" : ""}">${documented.html}</span>
                    </div>
                </div>
            </section>
            <section class="section">
                <h2>Health disclosures</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Medical history</span>
                        <span class="value${medicalHistory.muted ? " muted" : ""}">${medicalHistory.html}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Allergies</span>
                        <span class="value${allergies.muted ? " muted" : ""}">${allergies.html}</span>
                    </div>
                </div>
            </section>
            <section class="section">
                <div class="notes">
                    ${
                        kind === "medical"
                            ? "This certificate affirms that the patient was examined by the clinic physician and is issued upon request for medical or academic purposes."
                            : "This certificate confirms the dental evaluation performed by the clinic dentist and may be submitted for university compliance or related requirements."
                    }
                </div>
            </section>
            <div class="signature">
                <div class="block">
                    <span class="line"></span>
                    <div class="name">${escapeHtml(data.doctorName)}</div>
                    <div class="title">${escapeHtml(data.doctorTitle)}</div>
                </div>
            </div>
            <footer>
                ${
                    kind === "medical"
                        ? "Issued by the Holy Name University Health Services Department. This document is valid only when signed by the attending physician."
                        : "Holy Name University Health Services Department • Dental Section. Valid only when signed by the attending dentist."
                }
            </footer>
        </main>
    </body>
</html>`;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const appointment = await prisma.appointment.findFirst({
            where: {
                appointment_id: params.id,
                doctor_user_id: session.user.id,
            },
            select: {
                appointment_id: true,
                appointment_timestart: true,
                clinic: { select: { clinic_name: true } },
                consultation: {
                    select: {
                        reason_of_visit: true,
                        findings: true,
                        diagnosis: true,
                        updatedAt: true,
                    },
                },
                doctor: {
                    select: {
                        username: true,
                        specialization: true,
                        employee: { select: { fname: true, mname: true, lname: true } },
                    },
                },
                patient: {
                    select: {
                        username: true,
                        student: {
                            select: {
                                student_id: true,
                                fname: true,
                                mname: true,
                                lname: true,
                                address: true,
                                program: true,
                                year_level: true,
                                date_of_birth: true,
                                gender: true,
                                medical_cond: true,
                                allergies: true,
                            },
                        },
                    },
                },
            },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }

        const doctor = appointment.doctor;
        if (!doctor || doctor.specialization == null) {
            return NextResponse.json({ error: "Doctor specialization unavailable" }, { status: 400 });
        }

        if (doctor.specialization !== DoctorSpecialization.Physician && doctor.specialization !== DoctorSpecialization.Dentist) {
            return NextResponse.json({ error: "Certificate generation not supported for this specialization" }, { status: 400 });
        }

        const patient = appointment.patient.student;
        if (!patient) {
            return NextResponse.json({ error: "Certificates are available for student appointments only" }, { status: 400 });
        }

        const now = manilaNow();
        const age = computeAge(patient.date_of_birth, now);
        const doctorName = buildFullName(doctor.employee, doctor.username || "Clinic Physician");
        const patientName = buildFullName({ fname: patient.fname, mname: patient.mname, lname: patient.lname }, appointment.patient.username);
        const clinicName = appointment.clinic?.clinic_name ?? "Holy Name University Clinic";

        const yearLevelLabel = patient.year_level ? YEAR_LEVEL_LABELS[patient.year_level] ?? patient.year_level : null;

        const data: CertificateData = {
            issueDate: formatDateLong(now) ?? new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: PH_TIME_ZONE }).format(now),
            clinicName,
            patientName,
            studentId: patient.student_id ?? null,
            address: patient.address ?? null,
            age,
            gender: formatGender(patient.gender),
            program: patient.program ?? null,
            yearLevel: yearLevelLabel,
            appointmentDate: formatDateLong(appointment.appointment_timestart),
            appointmentTime: formatTimeShort(appointment.appointment_timestart),
            reason: appointment.consultation?.reason_of_visit ?? null,
            findings: appointment.consultation?.findings ?? null,
            diagnosis: appointment.consultation?.diagnosis ?? null,
            medicalHistory: patient.medical_cond ?? null,
            allergies: patient.allergies ?? null,
            consultationUpdated: formatDateLong(appointment.consultation?.updatedAt ?? null),
            doctorName,
            doctorTitle: doctor.specialization === DoctorSpecialization.Physician ? "Clinic Physician" : "Clinic Dentist",
        };

        const kind: CertificateKind = doctor.specialization === DoctorSpecialization.Physician ? "medical" : "dental";
        const html = createCertificateHtml(kind, data);

        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: true,
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "load" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "18mm", bottom: "18mm", left: "14mm", right: "14mm" },
        });

        const pdfArrayBuffer =
            pdfBuffer instanceof ArrayBuffer
                ? pdfBuffer
                : pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);

        const filenamePrefix = kind === "medical" ? "medical-certificate" : "dental-certificate";
        const filename = `${filenamePrefix}-${slugify(patientName)}.pdf`;

        return new Response(pdfArrayBuffer as ArrayBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("[GET /api/doctor/appointments/:id/certificate]", error);
        return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error("Failed to close browser", closeError);
            }
        }
    }
}
