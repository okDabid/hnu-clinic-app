import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { handleAuthError, requireRole } from "@/lib/authorization";
import {
    CLINIC_CONTACT_NUMBER_LENGTH,
    PH_MOBILE_PREFIX,
    isValidClinicContactNumber,
} from "@/lib/clinic-contact";

// GET /api/nurse/clinic/[id]
type ClinicRouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(
    _req: NextRequest,
    { params }: ClinicRouteContext
) {
    try {
        await requireRole([Role.NURSE]);

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
        }

        const clinic = await prisma.clinic.findUnique({
            where: { clinic_id: id },
        });

        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        return NextResponse.json(clinic);
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("GET /clinic/[id] error:", err);
        return NextResponse.json({ error: "Failed to fetch clinic" }, { status: 500 });
    }
}

// PUT /api/nurse/clinic/[id]
export async function PUT(
    req: NextRequest,
    { params }: ClinicRouteContext
) {
    try {
        await requireRole([Role.NURSE]);

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
        }

        const body = await req.json();
        const { clinic_name, clinic_location, clinic_contactno } = body;

        if (!clinic_name && !clinic_location && !clinic_contactno) {
            return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
        }

        let normalizedContactNumber: string | undefined;
        if (clinic_contactno !== undefined) {
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

            normalizedContactNumber = trimmedContactNo;
        }

        // Prevent renaming to an existing clinic
        if (clinic_name) {
            const duplicate = await prisma.clinic.findFirst({
                where: { clinic_name, NOT: { clinic_id: id } },
            });
            if (duplicate) {
                return NextResponse.json(
                    { error: "Another clinic with this name already exists" },
                    { status: 409 }
                );
            }
        }

        const updatedClinic = await prisma.clinic.update({
            where: { clinic_id: id },
            data: {
                ...(clinic_name && { clinic_name }),
                ...(clinic_location && { clinic_location }),
                ...(normalizedContactNumber && { clinic_contactno: normalizedContactNumber }),
            },
        });

        return NextResponse.json(updatedClinic);
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("PUT /clinic/[id] error:", err);
        return NextResponse.json({ error: "Failed to update clinic" }, { status: 500 });
    }
}
