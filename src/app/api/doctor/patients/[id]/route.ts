import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { patientRecordPatchSchema, updatePatientRecordEntry } from "@/lib/patient-records-update";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "Missing patient ID" }, { status: 400 });
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
        console.error("PATCH /api/doctor/patients/[id] error:", err);
        return NextResponse.json(
            { error: "Failed to update patient information" },
            { status: 500 }
        );
    }
}