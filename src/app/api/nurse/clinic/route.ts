import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { handleAuthError, requireRole } from "@/lib/authorization";

// GET /api/nurse/clinic
export async function GET() {
    try {
        await requireRole([Role.NURSE, Role.ADMIN]);

        const clinics = await prisma.clinic.findMany();
        return NextResponse.json(clinics);
    } catch (err: unknown) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("GET /clinic error:", err);
        return NextResponse.json({ error: "Failed to load clinics" }, { status: 500 });
    }
}

// POST /api/nurse/clinic
export async function POST(req: NextRequest) {
    try {
        await requireRole([Role.NURSE, Role.ADMIN]);

        const { clinic_name, clinic_location, clinic_contactno } = await req.json();

        if (!clinic_name || !clinic_location || !clinic_contactno) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const newClinic = await prisma.clinic.create({
            data: {
                clinic_name,
                clinic_location,
                clinic_contactno
            },
        });

        return NextResponse.json(newClinic);
    } catch (err: unknown) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
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
