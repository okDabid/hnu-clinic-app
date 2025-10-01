import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ GET all clinics
export async function GET() {
    try {
        const clinics = await prisma.clinic.findMany();
        return NextResponse.json(clinics);
    } catch (err: unknown) {
        console.error("GET /clinic error:", err);
        return NextResponse.json({ error: "Failed to load clinics" }, { status: 500 });
    }
}

// ✅ POST create new clinic (safe for prod)
export async function POST(req: NextRequest) {
    try {
        const { clinic_name, clinic_location, clinic_contactno } = await req.json();

        if (!clinic_name || !clinic_location || !clinic_contactno) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // check if slug column exists (prod might still have it)
        let hasSlug = false;
        try {
            await prisma.$queryRaw`SELECT slug FROM "Clinic" LIMIT 1`;
            hasSlug = true;
        } catch {
            hasSlug = false; // column doesn't exist
        }

        const newClinic = await prisma.clinic.create({
            data: {
                clinic_name,
                clinic_location,
                clinic_contactno,
                ...(hasSlug && {
                    slug: clinic_name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
                }),
            },
        });

        return NextResponse.json(newClinic);
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error("POST /clinic error:", err.message, err.stack);
            return NextResponse.json(
                { error: "Failed to create clinic", details: err.message },
                { status: 500 }
            );
        }
        console.error("POST /clinic unknown error:", err);
        return NextResponse.json({ error: "Failed to create clinic" }, { status: 500 });
    }
}
