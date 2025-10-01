import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch a single clinic by ID
export async function GET(
    req: Request,
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

// PUT: Update a clinic by ID
export async function PUT(
    req: Request,
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
                slug: clinic_name
                    ? clinic_name.toLowerCase().replace(/\s+/g, "-")
                    : undefined,
            },
        });

        return NextResponse.json(updatedClinic);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to update clinic" }, { status: 500 });
    }
}
