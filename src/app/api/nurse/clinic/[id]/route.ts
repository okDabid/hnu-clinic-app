// src/app/api/nurse/clinic/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ GET /api/nurse/clinic/[id]
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!params?.id) {
            return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
        }

        const clinic = await prisma.clinic.findUnique({
            where: { clinic_id: params.id },
        });

        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        return NextResponse.json(clinic);
    } catch (err) {
        console.error("GET /clinic/[id] error:", err);
        return NextResponse.json({ error: "Failed to fetch clinic" }, { status: 500 });
    }
}

// ✅ PUT /api/nurse/clinic/[id]
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!params?.id) {
            return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
        }

        const body = await req.json();
        const { clinic_name, clinic_location, clinic_contactno } = body;

        // Guard against empty payload
        if (!clinic_name && !clinic_location && !clinic_contactno) {
            return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
        }

        const updatedClinic = await prisma.clinic.update({
            where: { clinic_id: params.id },
            data: {
                ...(clinic_name && { clinic_name }),
                ...(clinic_location && { clinic_location }),
                ...(clinic_contactno && { clinic_contactno }),
            },
        });

        return NextResponse.json(updatedClinic);
    } catch (err) {
        console.error("PUT /clinic/[id] error:", err);
        return NextResponse.json({ error: "Failed to update clinic" }, { status: 500 });
    }
}
