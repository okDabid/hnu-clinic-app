import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfManilaDay, endOfManilaDay } from "@/lib/time";
import { computeSlotsForDoctor } from "@/lib/doctor-availability";

/**
 * GET /api/meta/doctor-availability
 * Query params:
 * - clinic_id
 * - doctor_user_id
 * - date (YYYY-MM-DD, Manila)
 *
 * Returns: Array of available time slots (15 mins each)
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const clinic_id = searchParams.get("clinic_id");
        const doctor_user_id = searchParams.get("doctor_user_id");
        const date = searchParams.get("date");

        if (!clinic_id || !doctor_user_id || !date) {
            return NextResponse.json(
                { message: "Missing required parameters" },
                { status: 400 }
            );
        }

        // Manila-local day bounds (works in UTC prod)
        const dayStart = startOfManilaDay(date);
        const dayEnd = endOfManilaDay(date);

        // 1) Availabilities for that clinic/doctor on that Manila day
        const availabilities = await prisma.doctorAvailability.findMany({
            where: {
                clinic_id,
                doctor_user_id,
                available_date: { gte: dayStart, lte: dayEnd },
            },
            orderBy: { available_timestart: "asc" },
        });

        if (availabilities.length === 0) {
            return NextResponse.json({ slots: [] });
        }

        // 2) Existing appointments that block slots (Manila day)
        const appointments = await prisma.appointment.findMany({
            where: {
                doctor_user_id,
                appointment_timestart: { gte: dayStart, lte: dayEnd },
                status: { in: ["Pending", "Approved"] },
            },
            select: {
                appointment_timestart: true,
                appointment_timeend: true,
            },
        });
        const slots = computeSlotsForDoctor(availabilities, appointments);

        return NextResponse.json({ slots });
    } catch (err) {
        console.error("[GET /api/meta/doctor-availability]", err);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
