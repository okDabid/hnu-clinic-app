import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/withDb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/clinics
 * Returns all active clinics with their basic info.
 * Accessible by authenticated users (doctor/nurse/admin).
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch clinics
        const clinics = await withDb(() =>
            prisma.clinic.findMany({
                select: {
                    clinic_id: true,
                    clinic_name: true,
                    clinic_location: true,
                    clinic_contactno: true,
                },
                orderBy: { clinic_name: "asc" },
            })
        );

        return NextResponse.json(clinics);
    } catch (err) {
        console.error("[GET /api/clinics]", err);
        return NextResponse.json(
            { error: "Failed to fetch clinics" },
            { status: 500 }
        );
    }
}
