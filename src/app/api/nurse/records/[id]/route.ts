import { NextResponse } from "next/server";

import { patientRecordPatchSchema, updatePatientRecordEntry } from "@/lib/patient-records-update";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // FIXED for Next.js 14+
) {
    try {
        // Must await params in Next.js 14 dynamic routes
        const { id } = await params;

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
        console.error("PATCH /api/nurse/records/[id] error:", err);
        return NextResponse.json(
            { error: "Failed to update health data" },
            { status: 500 }
        );
    }
}