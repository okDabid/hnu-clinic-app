import { NextResponse } from "next/server";
import { AccountStatus, Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import { withDb } from "@/lib/withDb";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/meta/doctors?clinic_id=...&service_type=...
 * Returns doctors available for a given clinic and filtered by service type.
 */
async function handler(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const clinic_id = searchParams.get("clinic_id");
        const service_type = searchParams.get("service_type"); // optional: "Consultation", "Dental", etc.

        if (!clinic_id) {
            return NextResponse.json(
                { message: "clinic_id is required" },
                { status: 400 }
            );
        }

        // Optional specialization filter based on service_type
        let specializationFilter: "Physician" | "Dentist" | undefined;
        if (service_type) {
            if (service_type.toLowerCase().includes("dental")) {
                specializationFilter = "Dentist";
            } else {
                specializationFilter = "Physician";
            }
        }

        // Fetch doctors (with optional filter)
        const doctors = await withDb(() =>
            prisma.users.findMany({
                where: {
                    role: Role.DOCTOR,
                    status: AccountStatus.Active,
                    employee: {
                        is: {
                            status: AccountStatus.Active,
                            ...(specializationFilter && { specialization: specializationFilter }),
                        },
                    },
                    doctorAvail: {
                        some: {
                            clinic_id,
                        },
                    },
                },
                select: {
                    user_id: true,
                    username: true,
                    employee: { select: { fname: true, lname: true, specialization: true } },
                },
                orderBy: { username: "asc" },
            })
        );

        // Build final data (include specialization)
        const shaped = doctors.map((d) => ({
            user_id: d.user_id,
            name:
                d.employee?.fname && d.employee?.lname
                    ? `${d.employee.fname} ${d.employee.lname}`
                    : d.username,
            specialization: d.employee?.specialization ?? null, // 👈 send to frontend
        }));

        return NextResponse.json(shaped);
    } catch (err) {
        console.error("[GET /api/meta/doctors]", err);
        return NextResponse.json(
            { message: "Failed to load doctors" },
            { status: 500 }
        );
    }
}

export const GET = withRateLimit(
    {
        key: (request) => {
            const ip = getClientIp(request);
            if (!ip) return null;
            const { searchParams } = new URL(request.url);
            const clinic = searchParams.get("clinic_id") ?? "any";
            return `meta:doctors:${ip}:${clinic}`;
        },
        limit: 40,
        windowMs: 60_000,
        message: "Too many doctor directory requests. Please try again later.",
    },
    handler
);
