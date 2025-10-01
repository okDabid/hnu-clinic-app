// src/app/api/nurse/clinic/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/nurse/clinic/:id
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const clinic = await prisma.clinic.findUnique({
            where: { clinic_id: params.id },
        });

        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        return NextResponse.json(clinic);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch clinic" }, { status: 500 });
    }
}

// PUT /api/nurse/clinic/:id
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { clinic_name, clinic_location, clinic_contactno } = await req.json();

        const updatedClinic = await prisma.clinic.update({
            where: { clinic_id: params.id },
            data: {
                clinic_name,
                clinic_location,
                clinic_contactno,
                // keep if your schema still has slug; otherwise remove this line
                slug: clinic_name ? clinic_name.toLowerCase().replace(/\s+/g, "-") : undefined,
            },
        });

        return NextResponse.json(updatedClinic);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to update clinic" }, { status: 500 });
    }
}
