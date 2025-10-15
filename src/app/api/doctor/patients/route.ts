import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchPatientRecords } from "@/lib/patient-records";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctor = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { role: true },
        });

        if (!doctor || doctor.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const records = await fetchPatientRecords();
        return NextResponse.json(records);
    } catch (err) {
        console.error("[GET /api/doctor/patients]", err);
        return NextResponse.json(
            { error: "Failed to fetch patient records" },
            { status: 500 }
        );
    }
}