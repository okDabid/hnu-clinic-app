import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchPatientRecords } from "@/lib/patient-records";

function matchesSearch(value: string | null | undefined, search: string) {
    if (!value) return false;
    return value.toLowerCase().includes(search);
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const account = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { role: true },
        });

        if (!account || account.role !== Role.SCHOLAR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const url = new URL(req.url);
        const typeParam = url.searchParams.get("type")?.toLowerCase();
        const statusParam = url.searchParams.get("status")?.toLowerCase();
        const searchParam = url.searchParams.get("search")?.toLowerCase().trim() ?? "";
        const withAppointment = url.searchParams.get("withAppointment");

        const records = await fetchPatientRecords();

        const filtered = records.filter((record) => {
            if (typeParam && typeParam !== "all") {
                if (typeParam === "student" && record.patientType !== "Student") return false;
                if (typeParam === "employee" && record.patientType !== "Employee") return false;
            }

            if (statusParam && statusParam !== "all") {
                if (record.status.toLowerCase() !== statusParam) return false;
            }

            if (withAppointment === "yes" && !record.latestAppointment) return false;
            if (withAppointment === "no" && record.latestAppointment) return false;

            if (searchParam) {
                const haystack = [
                    record.fullName,
                    record.patientId,
                    record.patientType,
                    record.department,
                    record.program,
                    record.year_level,
                    record.contactno,
                    record.address,
                    record.emergency?.name,
                    record.emergency?.num,
                    record.emergency?.relation,
                ];

                const matchFound = haystack.some((item) => matchesSearch(item ?? undefined, searchParam));
                if (!matchFound) return false;
            }

            return true;
        });

        return NextResponse.json(filtered);
    } catch (err) {
        console.error("[GET /api/scholar/patients]", err);
        return NextResponse.json(
            { error: "Failed to fetch patient list" },
            { status: 500 }
        );
    }
}
