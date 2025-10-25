import { NextResponse } from "next/server";

import { patientRecordPatchSchema, updatePatientRecordEntry } from "@/lib/patient-records-update";
import { handleAuthError, requireRole } from "@/lib/authorization";
import { Role } from "@prisma/client";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await requireRole([Role.NURSE, Role.ADMIN]);

        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: "Missing patient ID in request params" },
                { status: 400 }
            );
        }

        const json = await req.json();
        const parsed = patientRecordPatchSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const updated = await updatePatientRecordEntry(id, parsed.data);
        return NextResponse.json(updated);
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("PATCH /api/nurse/records/[id] error:", err);
        return NextResponse.json(
            { error: "Failed to update health data" },
            { status: 500 }
        );
    }
}