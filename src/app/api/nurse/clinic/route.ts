import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ========================
// GET /api/nurse/clinic
// ========================
export async function GET() {
    try {
        const clinics = await prisma.clinic.findMany();
        return NextResponse.json(clinics, { status: 200 });
    } catch (err) {
        console.error("GET /clinic error:", err);
        return NextResponse.json({ error: "Failed to fetch clinics" }, { status: 500 });
    }
}

// ========================
// POST /api/nurse/clinic
// ========================
export async function POST(req: NextRequest) {
    try {
        const { clinic_name, clinic_location, clinic_contactno } = await req.json();

        if (!clinic_name || !clinic_location || !clinic_contactno) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        const newClinic = await prisma.clinic.create({
            data: {
                clinic_name,
                clinic_location,
                clinic_contactno,
            },
        });

        return NextResponse.json(newClinic, { status: 201 });
    } catch (err) {
        console.error("POST /clinic error:", err);
        return NextResponse.json({ error: "Failed to create clinic" }, { status: 500 });
    }
}
