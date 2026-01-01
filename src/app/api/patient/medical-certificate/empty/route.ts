import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { formatManilaDateTime, manilaNow } from "@/lib/time";
import { formatDateLong, renderCertificateHtml } from "@/lib/medical-certificate";
import { launchServerlessChromium } from "@/lib/serverless-chromium";
import { type MedicalHistoryValue } from "@/lib/medical-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildEmptyMedicalHistory(): MedicalHistoryValue {
    return { conditions: [], other: "" };
}

export async function GET() {
    try {
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

        const now = manilaNow();
        const validity = new Date(now);
        validity.setUTCFullYear(validity.getUTCFullYear() + 1);
        const issueDateDisplay = formatDateLong(now);
        const consultationDate = formatManilaDateTime(now) ?? issueDateDisplay;

        const html = renderCertificateHtml({
            certificateId: "",
            issueDate: now,
            validUntil: validity,
            issueDateDisplay,
            patientName: "",
            patientType: "",
            age: "",
            sex: "",
            address: "",
            program: "",
            department: "",
            yearLevel: "",
            clinicName: "",
            consultationDate,
            diagnosis: "",
            findings: "",
            reason: "",
            allergies: [],
            medicalHistory: buildEmptyMedicalHistory(),
            doctorName: "",
            doctorTitle: "",
            licenseNumber: "",
            ptrNumber: "",
            includeCertificateId: false,
            blankTemplate: true,
        });

        const browser = await launchServerlessChromium();

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: "networkidle" });
            await page.emulateMedia({ media: "print" });
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
                    : pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);

            return new Response(pdfArrayBuffer as ArrayBuffer, {
                status: 200,
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": "attachment; filename=medical-certificate-template.pdf",
                    "Cache-Control": "no-store",
                },
            });
        } finally {
            await browser.close();
        }
    } catch (error) {
        console.error("[GET /api/patient/medical-certificate/empty]", error);
        return NextResponse.json({ error: "Failed to prepare blank certificate" }, { status: 500 });
    }
}
