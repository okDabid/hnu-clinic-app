import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all clinics
export async function GET() {
    try {
        const clinics = await prisma.clinic.findMany();
        return NextResponse.json(clinics);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to load clinics" }, { status: 500 });
    }
}

// POST: Create new clinic
export async function POST(req: Request) {
    try {
        const { clinic_name, clinic_location, clinic_contactno } = await req.json();

        if (!clinic_name || !clinic_location || !clinic_contactno) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
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
        console.error(err);
        return NextResponse.json({ error: "Failed to create clinic" }, { status: 500 });
    }
}
