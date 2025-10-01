import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all clinics
export async function GET() {
    try {
        const clinics = await prisma.clinic.findMany();
        return NextResponse.json(clinics);
    } catch (err) {
        console.error("GET /clinic error:", err);
        return NextResponse.json({ error: "Failed to load clinics" }, { status: 500 });
    }
}

// POST: Create new clinic (with duplicate safeguard)
export async function POST(req: NextRequest) {
    try {
        const { clinic_name, clinic_location, clinic_contactno } = await req.json();

        if (!clinic_name || !clinic_location || !clinic_contactno) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // ✅ Prevent duplicate clinic names
        const existing = await prisma.clinic.findFirst({
            where: { clinic_name },
        });
        if (existing) {
            return NextResponse.json({ error: "Clinic with this name already exists" }, { status: 409 });
        }

        const newClinic = await prisma.clinic.create({
            data: {
                clinic_name,
                clinic_location,
                clinic_contactno,
            },
        });

        return NextResponse.json(newClinic);
    } catch (err) {
        console.error("POST /clinic error:", err);
        return NextResponse.json({ error: "Failed to create clinic" }, { status: 500 });
    }
}
