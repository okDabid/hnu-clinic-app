import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/meta/doctors?clinic_id=...&service_type=...
 * Returns doctors available for a given clinic and filtered by service type.
 */
export async function GET(req: Request) {
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

        // Get all doctors available in the clinic
        const availabilities = await prisma.doctorAvailability.findMany({
            where: { clinic_id },
            select: { doctor_user_id: true },
            distinct: ["doctor_user_id"],
        });

        const doctorIds = availabilities.map((a) => a.doctor_user_id);
        if (doctorIds.length === 0) return NextResponse.json([]);

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
        const doctors = await prisma.users.findMany({
            where: {
                user_id: { in: doctorIds },
                role: "DOCTOR",
                ...(specializationFilter && { specialization: specializationFilter }),
            },
            select: {
                user_id: true,
                username: true,
                specialization: true,
                employee: { select: { fname: true, lname: true } },
            },
            orderBy: { username: "asc" },
        });

        // Build final data (include specialization)
        const shaped = doctors.map((d) => ({
            user_id: d.user_id,
            name:
                d.employee?.fname && d.employee?.lname
                    ? `${d.employee.fname} ${d.employee.lname}`
                    : d.username,
            specialization: d.specialization ?? null, // 👈 send to frontend
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
