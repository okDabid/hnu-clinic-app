import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MedcertStatus, Role } from "@prisma/client";
import { manilaNow, formatManilaDateTime } from "@/lib/time";
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

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
        where: { user_id: session.user.id },
        select: { role: true },
    });

    if (!user || user.role !== Role.PATIENT) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const latest = await prisma.medCert.findFirst({
        where: { patient_user_id: session.user.id },
        orderBy: { issue_date: "desc" },
        include: {
            consultation: {
                include: {
                    appointment: {
                        include: {
                            clinic: { select: { clinic_name: true } },
                            doctor: {
                                select: {
                                    username: true,
                                    employee: {
                                        select: {
                                            fname: true,
                                            mname: true,
                                            lname: true,
                                            specialization: true,
                                        },
                                    },
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
                                            date_of_birth: true,
                                            gender: true,
                                            program: true,
                                            department: true,
                                            year_level: true,
                                            allergies: true,
                                            medical_cond: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!latest) {
        return NextResponse.json({ certificate: null }, { status: 200 });
    }

    const now = manilaNow();
    const isLocal = !process.env.AWS_REGION && !process.env.VERCEL;

    let medcert = latest;
    if (medcert.valid_until < now && medcert.status !== MedcertStatus.Expired) {
        medcert = await prisma.medCert.update({
            where: { certificate_id: medcert.certificate_id },
            data: { status: MedcertStatus.Expired },
            include: {
                consultation: {
                    include: {
                        appointment: {
                            include: {
                                clinic: { select: { clinic_name: true } },
                                doctor: {
                                    select: {
                                        username: true,
                                        employee: {
                                            select: {
                                                fname: true,
                                                mname: true,
                                                lname: true,
                                                specialization: true,
                                            },
                                        },
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
                                                date_of_birth: true,
                                                gender: true,
                                                program: true,
                                                department: true,
                                                year_level: true,
                                                allergies: true,
                                                medical_cond: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    const consultation = medcert.consultation;
    const appointment = medcert.consultation?.appointment;
    if (!consultation || !appointment) {
        return NextResponse.json(
            { error: "Certificate is missing appointment details." },
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
        diagnosis: consultation?.diagnosis ?? "",
        findings: consultation?.findings ?? "",
        reason: consultation?.reason_of_visit ?? "",
        allergies,
        medicalHistory,
        doctorName,
        doctorTitle: "Attending Physician",
        licenseNumber: "",
        ptrNumber: "",
    };

    const payload = {
        certificateId: medcert.certificate_id,
        status: medcert.status,
        issueDate: medcert.issue_date.toISOString(),
        validUntil: medcert.valid_until.toISOString(),
        appointmentId: appointment.appointment_id,
        consultationId: medcert.consultation_id,
        clinicName: appointment.clinic.clinic_name,
        doctorName,
        consultationDate,
    };

    const format = new URL(request.url).searchParams.get("format");
    if (format === "pdf") {
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

            const filename = `medical-certificate-${slugify(patientName)}.pdf`;

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
    }

    return NextResponse.json({ certificate: payload });
}

