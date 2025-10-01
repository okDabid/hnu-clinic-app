import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET by ID
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const clinic = await prisma.clinic.findUnique({ where: { clinic_id: id } });
    if (!clinic) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(clinic);
}

// PUT update by ID
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { clinic_name, clinic_location, clinic_contactno } = await req.json();
    const updated = await prisma.clinic.update({
        where: { clinic_id: id },
        data: { clinic_name, clinic_location, clinic_contactno },
    });
    return NextResponse.json(updated);
}
