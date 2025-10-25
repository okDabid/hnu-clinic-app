import { NextResponse } from "next/server";

import { fetchPatientRecords } from "@/lib/patient-records";
import { handleAuthError, requireRole } from "@/lib/authorization";
import { Role } from "@prisma/client";

export async function GET() {
    try {
        await requireRole([Role.NURSE, Role.ADMIN]);

        const records = await fetchPatientRecords();
        return NextResponse.json(records);
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("[GET /api/nurse/records]", err);
        return NextResponse.json(
            { error: "Failed to fetch patient records" },
            { status: 500 }
        );
    }
}
