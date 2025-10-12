import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/doctors?clinic_id=...&service_type=...
 * Returns doctors available for a given clinic.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const clinic_id = searchParams.get("clinic_id");
        const service_type = searchParams.get("service_type"); // optional

        if (!clinic_id) {
            return NextResponse.json(
                { message: "clinic_id is required" },
                { status: 400 }
            );
        }

        // Find doctors with availability in this clinic
        const avail = await prisma.doctorAvailability.findMany({
            where: { clinic_id },
            select: { doctor_user_id: true },
            distinct: ["doctor_user_id"],
        });

        const doctorIds = avail.map((a) => a.doctor_user_id);
        if (doctorIds.length === 0) return NextResponse.json([]);

        // Fetch doctor details
        const doctors = await prisma.users.findMany({
            where: { user_id: { in: doctorIds }, role: "DOCTOR" },
            select: {
                user_id: true,
                username: true,
                employee: { select: { fname: true, lname: true } },
                student: { select: { fname: true, lname: true } },
            },
            orderBy: { username: "asc" },
        });

        // Build display name
        const shaped = doctors.map((d) => ({
            user_id: d.user_id,
            name:
                d.employee?.fname && d.employee?.lname
                    ? `${d.employee.fname} ${d.employee.lname}`
                    : d.student?.fname && d.student?.lname
                        ? `${d.student.fname} ${d.student.lname}`
                        : d.username, // fallback if no employee/student record
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
