import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { manilaNow } from "@/lib/time";
import { DoctorSpecialization, MedcertStatus, Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
    appointment_id: z.string().min(1, "appointment_id is required"),
});

type NullableString = string | null | undefined;

type CertificateKind = "Medical Certificate" | "Dental Certificate";

type CertificateTemplateData = {
    title: CertificateKind;
    issueDate: string;
    patientName: string;
    address: string;
    courseYear: string;
    ageText: string;
    gender: string;
    visitDate: string;
    clinicName: string;
    summaryParagraphs: string[];
    notes: { label: string; value: string }[];
    footerNote: string;
    doctorName: string;
    doctorLabel: string;
};

function escapeHtml(value: NullableString) {
    if (!value) return "";
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

function formatParagraph(text: string) {
    return `<p>${escapeHtml(text)}</p>`;
}

function renderCertificateHtml(data: CertificateTemplateData) {
    const notesHtml = data.notes.length
        ? `<div class="notes">
                <h3>Clinical summary</h3>
                <ul>
                    ${data.notes
                        .map(
                            (note) =>
                                `<li><span class="label">${escapeHtml(note.label)}:</span><span class="value">${escapeHtml(
                                    note.value,
                                ) || "—"}</span></li>`,
                        )
                        .join("\n")}
                </ul>
            </div>`
        : "";

    const paragraphsHtml = data.summaryParagraphs.map((paragraph) => formatParagraph(paragraph)).join("\n");

    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(data.title)}</title>
        <style>
            :root {
                color-scheme: light;
            }

            * {
                box-sizing: border-box;
            }

            @page {
                size: A4;
                margin: 18mm;
            }

            body {
                margin: 0;
                padding: 0;
                font-family: "Times New Roman", Georgia, serif;
                background: #f4f5f9;
                color: #1f2933;
            }

            main {
                background: #ffffff;
                padding: 32px 36px 40px;
                border-radius: 18px;
                border: 1px solid #e5e7eb;
                max-width: 760px;
                margin: 0 auto;
                box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
            }

            header {
                text-align: center;
                margin-bottom: 28px;
            }

            header .institution {
                font-size: 20px;
                font-weight: 700;
                letter-spacing: 0.6px;
            }

            header .department {
                font-size: 16px;
                font-weight: 500;
                color: #2563eb;
                margin-top: 4px;
                text-transform: uppercase;
                letter-spacing: 3px;
            }

            .title-block {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: 16px;
                margin-top: 24px;
                padding-bottom: 12px;
                border-bottom: 2px solid #111827;
            }

            .title-block h1 {
                margin: 0;
                font-size: 28px;
                letter-spacing: 3px;
            }

            .title-block .issue-date {
                font-size: 14px;
                color: #4b5563;
            }

            .patient-info {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px 24px;
                margin: 24px 0;
                font-size: 15px;
            }

            .patient-info .row {
                display: flex;
                gap: 8px;
            }

            .patient-info .label {
                font-weight: 600;
                min-width: 110px;
                color: #111827;
            }

            .patient-info .value {
                flex: 1;
                border-bottom: 1px solid #cbd5f5;
                padding-bottom: 2px;
            }

            section.summary {
                margin-bottom: 24px;
                font-size: 15px;
                line-height: 1.6;
            }

            section.summary p {
                margin: 0 0 12px 0;
            }

            .notes {
                margin-top: 16px;
                padding: 16px;
                background: #f8fafc;
                border: 1px solid #dbeafe;
                border-radius: 12px;
            }

            .notes h3 {
                margin: 0 0 12px 0;
                font-size: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #1d4ed8;
            }

            .notes ul {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .notes li {
                display: flex;
                gap: 8px;
                margin-bottom: 8px;
            }

            .notes .label {
                min-width: 140px;
                font-weight: 600;
            }

            .notes .value {
                flex: 1;
            }

            footer {
                margin-top: 48px;
                display: flex;
                justify-content: flex-end;
            }

            .signature {
                text-align: center;
                min-width: 240px;
            }

            .signature .line {
                border-top: 1px solid #111827;
                margin-bottom: 8px;
                padding-top: 16px;
            }

            .signature .name {
                font-weight: 600;
            }

            .signature .label {
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #4b5563;
            }
        </style>
    </head>
    <body>
        <main>
            <header>
                <div class="institution">Holy Name University</div>
                <div class="department">Health Services Department</div>
                <div class="title-block">
                    <h1>${escapeHtml(data.title)}</h1>
                    <div class="issue-date">Date: ${escapeHtml(data.issueDate)}</div>
                </div>
            </header>

            <section class="patient-info">
                <div class="row"><span class="label">Name</span><span class="value">${escapeHtml(
                    data.patientName,
                )}</span></div>
                <div class="row"><span class="label">Course / Year</span><span class="value">${escapeHtml(
                    data.courseYear,
                )}</span></div>
                <div class="row"><span class="label">Address</span><span class="value">${escapeHtml(
                    data.address,
                )}</span></div>
                <div class="row"><span class="label">Age / Sex</span><span class="value">${escapeHtml(
                    [data.ageText, data.gender].filter(Boolean).join(" / "),
                )}</span></div>
                <div class="row"><span class="label">Clinic</span><span class="value">${escapeHtml(
                    data.clinicName,
                )}</span></div>
                <div class="row"><span class="label">Visit Date</span><span class="value">${escapeHtml(
                    data.visitDate,
                )}</span></div>
            </section>

            <section class="summary">
                ${paragraphsHtml}
                ${notesHtml}
                <p>${escapeHtml(data.footerNote)}</p>
            </section>

            <footer>
                <div class="signature">
                    <div class="line"></div>
                    <div class="name">${escapeHtml(data.doctorName)}</div>
                    <div class="label">${escapeHtml(data.doctorLabel)}</div>
                </div>
            </footer>
        </main>
    </body>
</html>`;
}

function computeAge(dob: Date | null, reference: Date): string {
    if (!dob) return "";
    let age = reference.getFullYear() - dob.getFullYear();
    const monthDiff = reference.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < dob.getDate())) {
        age -= 1;
    }
    return age > 0 ? `${age}` : "";
}

const YEAR_LEVEL_LABELS: Record<string, string> = {
    FIRST_YEAR: "First Year",
    SECOND_YEAR: "Second Year",
    THIRD_YEAR: "Third Year",
    FOURTH_YEAR: "Fourth Year",
    FIFTH_YEAR: "Fifth Year",
    KINDERGARTEN: "Kindergarten",
    ELEMENTARY: "Elementary",
    JUNIOR_HIGH: "Junior High",
    SENIOR_HIGH: "Senior High",
};

function formatCourseYear(program?: NullableString, yearLevel?: NullableString) {
    const programText = program ? String(program) : "";
    const yearText = yearLevel ? YEAR_LEVEL_LABELS[yearLevel] ?? String(yearLevel) : "";
    return [programText, yearText].filter(Boolean).join(" – ");
}

function buildSummaryParagraphs(kind: CertificateKind, patientName: string, visitDate: string, clinicName: string) {
    const paragraphs: string[] = [];

    if (kind === "Medical Certificate") {
        paragraphs.push(
            `This is to certify that ${patientName} was examined at the Holy Name University Health Services Department (${clinicName}) on ${visitDate}.`,
        );
        paragraphs.push(
            "Based on the clinical assessment, the patient was evaluated and managed accordingly. The findings and diagnosis are summarized below for reference.",
        );
    } else {
        paragraphs.push(
            `This certifies that ${patientName} underwent dental evaluation and management at the Holy Name University Dental Clinic (${clinicName}) on ${visitDate}.`,
        );
        paragraphs.push(
            "The dental assessment and interventions rendered during the visit are documented below for patient and academic reference.",
        );
    }

    return paragraphs;
}

function buildFooterNote(kind: CertificateKind) {
    if (kind === "Dental Certificate") {
        return "This dental certificate is issued upon the request of the concerned individual for school documentation and other lawful purposes.";
    }
    return "This medical certificate is issued upon the request of the patient for school compliance and other legitimate purposes.";
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 80) || "certificate";
}

function formatDateLong(date: Date | null) {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        dateStyle: "long",
    }).format(date);
}

function formatDateWithTime(date: Date | null) {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        dateStyle: "long",
        timeStyle: "short",
    }).format(date);
}

export async function POST(req: NextRequest) {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctor = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: {
                role: true,
                specialization: true,
                username: true,
                employee: { select: { fname: true, mname: true, lname: true } },
            },
        });

        if (!doctor || doctor.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        if (!doctor.specialization) {
            return NextResponse.json({ error: "Doctor specialization is not configured" }, { status: 400 });
        }

        const json = await req.json();
        const parsed = BodySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const { appointment_id } = parsed.data;

        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id },
            include: {
                clinic: { select: { clinic_name: true } },
                consultation: {
                    include: {
                        medcerts: true,
                    },
                },
                patient: {
                    select: {
                        username: true,
                        student: {
                            select: {
                                fname: true,
                                mname: true,
                                lname: true,
                                address: true,
                                program: true,
                                year_level: true,
                                gender: true,
                                date_of_birth: true,
                            },
                        },
                    },
                },
                doctor_user_id: true,
                patient_user_id: true,
                appointment_timestart: true,
                service_type: true,
            },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }

        if (appointment.doctor_user_id !== session.user.id) {
            return NextResponse.json({ error: "You can only issue certificates for your appointments" }, { status: 403 });
        }

        if (!appointment.patient.student) {
            return NextResponse.json({ error: "Certificates can only be issued for student patients" }, { status: 400 });
        }

        if (!appointment.consultation) {
            return NextResponse.json(
                { error: "Consultation notes are required before issuing a certificate" },
                { status: 400 },
            );
        }

        const kind: CertificateKind =
            doctor.specialization === DoctorSpecialization.Dentist
                ? "Dental Certificate"
                : "Medical Certificate";

        const patient = appointment.patient.student;
        const visitDate = appointment.appointment_timestart;
        const issueDate = manilaNow();
        const validUntil = new Date(issueDate.getTime());
        validUntil.setDate(validUntil.getDate() + 7);

        const patientName = [patient.fname, patient.mname, patient.lname].filter(Boolean).join(" ") ||
            appointment.patient.username;
        const courseYear = formatCourseYear(patient.program, patient.year_level);
        const age = computeAge(patient.date_of_birth, visitDate ?? issueDate);
        const ageText = age ? `${age} years old` : "";
        const gender = patient.gender ? String(patient.gender) : "";
        const clinicName = appointment.clinic?.clinic_name ?? "Holy Name University Clinic";

        const notes = [
            {
                label: "Reason for visit",
                value: appointment.consultation.reason_of_visit ?? "",
            },
            {
                label: "Findings",
                value: appointment.consultation.findings ?? "",
            },
            {
                label: "Diagnosis",
                value: appointment.consultation.diagnosis ?? "",
            },
        ].filter((note) => (note.value ?? "").trim().length > 0);

        const summaryParagraphs = buildSummaryParagraphs(
            kind,
            patientName,
            formatDateWithTime(visitDate),
            clinicName,
        );

        const footerNote = buildFooterNote(kind);
        const doctorName = [
            doctor.employee?.fname,
            doctor.employee?.mname,
            doctor.employee?.lname,
        ]
            .filter(Boolean)
            .join(" ") || doctor.username;
        const doctorLabel = kind === "Dental Certificate" ? "University Dentist" : "University Physician";

        const template: CertificateTemplateData = {
            title: kind,
            issueDate: formatDateLong(issueDate),
            patientName,
            address: patient.address ?? "",
            courseYear: courseYear || "",
            ageText,
            gender,
            visitDate: formatDateWithTime(visitDate),
            clinicName,
            summaryParagraphs,
            notes,
            footerNote,
            doctorName,
            doctorLabel,
        };

        const html = renderCertificateHtml(template);

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
            margin: { top: "15mm", bottom: "18mm", left: "15mm", right: "15mm" },
        });

        await page.close();

        const certificateRecord = await prisma.$transaction(async (tx) => {
            await tx.medCert.updateMany({
                where: {
                    consultation_id: appointment.consultation!.consultation_id,
                    status: MedcertStatus.Valid,
                },
                data: { status: MedcertStatus.Expired },
            });

            return tx.medCert.create({
                data: {
                    consultation_id: appointment.consultation!.consultation_id,
                    patient_user_id: appointment.patient_user_id,
                    issued_by_user_id: session.user.id,
                    issue_date: issueDate,
                    valid_until: validUntil,
                    status: MedcertStatus.Valid,
                },
            });
        });

        const issueDateIso = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Manila",
        }).format(issueDate);
        const filename = `${slugify(kind)}-${slugify(patientName)}-${issueDateIso}.pdf`;

        const pdfArrayBuffer =
            pdfBuffer instanceof ArrayBuffer
                ? pdfBuffer
                : pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);

        return new Response(pdfArrayBuffer as ArrayBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
                "X-Medcert-Id": certificateRecord.certificate_id,
            },
        });
    } catch (error) {
        console.error("[POST /api/doctor/patient-consultations/certificate]", error);
        return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
    } finally {
        if (browser) {
            await browser.close().catch(() => {
                // Suppress close errors
            });
        }
    }
}
