import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { handleAuthError, requireRole } from "@/lib/authorization";
import {
    CLINIC_CONTACT_NUMBER_LENGTH,
    PH_MOBILE_PREFIX,
    isValidClinicContactNumber,
} from "@/lib/clinic-contact";

// GET /api/nurse/clinic
export async function GET() {
    try {
        await requireRole([Role.NURSE]);

        const clinics = await prisma.clinic.findMany();
        return NextResponse.json(clinics);
    } catch (err: unknown) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("GET /clinic error:", err);
        return NextResponse.json({ error: "Failed to load clinics" }, { status: 500 });
    }
}

// POST /api/nurse/clinic
export async function POST(req: NextRequest) {
    try {
        await requireRole([Role.NURSE]);

        const { clinic_name, clinic_location, clinic_contactno } = await req.json();

        if (!clinic_name || !clinic_location || !clinic_contactno) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (typeof clinic_contactno !== "string") {
            return NextResponse.json(
                { error: "Clinic contact number must be provided as a string" },
                { status: 400 }
            );
        }

        const trimmedContactNo = clinic_contactno.trim();

        if (!isValidClinicContactNumber(trimmedContactNo)) {
            return NextResponse.json(
                {
                    error: `Clinic contact number must be a valid Philippine mobile number (${CLINIC_CONTACT_NUMBER_LENGTH} digits starting with ${PH_MOBILE_PREFIX}).`,
                },
                { status: 400 }
            );
        }

        const newClinic = await prisma.clinic.create({
            data: {
                clinic_name,
                clinic_location,
                clinic_contactno: trimmedContactNo,
            },
        });

        return NextResponse.json(newClinic);
    } catch (err: unknown) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        if (err instanceof Error) {
            console.error("POST /clinic error:", err.message, err.stack);
            return NextResponse.json(
                { error: "Failed to create clinic", details: err.message },
                { status: 500 }
            );
        }
        console.error("POST /clinic unknown error:", err);
        return NextResponse.json({ error: "Failed to create clinic" }, { status: 500 });
    }
}
