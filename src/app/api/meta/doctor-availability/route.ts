import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/meta/doctor-availability
 * Query params:
 *   - clinic_id
 *   - doctor_user_id
 *   - date (YYYY-MM-DD)
 * 
 * Returns: Array of available time slots (30 mins each)
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const clinic_id = searchParams.get("clinic_id");
        const doctor_user_id = searchParams.get("doctor_user_id");
        const date = searchParams.get("date");

        if (!clinic_id || !doctor_user_id || !date) {
            return NextResponse.json({ message: "Missing required parameters" }, { status: 400 });
        }

        // Parse date range for that day
        const dayStart = new Date(`${date}T00:00:00`);
        const dayEnd = new Date(`${date}T23:59:59`);

        // 1️⃣ Get doctor’s availability for that date and clinic
        const availabilities = await prisma.doctorAvailability.findMany({
            where: {
                clinic_id,
                doctor_user_id,
                available_date: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            orderBy: { available_timestart: "asc" },
        });

        if (availabilities.length === 0) {
            return NextResponse.json({ slots: [] });
        }

        // 2️⃣ Get existing appointments that block slots
        const appointments = await prisma.appointment.findMany({
            where: {
                doctor_user_id,
                appointment_date: {
                    gte: dayStart,
                    lte: dayEnd,
                },
                status: { in: ["Pending", "Approved"] },
            },
            select: {
                appointment_timestart: true,
                appointment_timeend: true,
            },
        });

        // Helper: check overlap between two ranges
        const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => {
            return aStart < bEnd && bStart < aEnd;
        };

        // Helper: convert Date → HH:mm
        const formatTime = (d: Date) => {
            const hours = String(d.getHours()).padStart(2, "0");
            const mins = String(d.getMinutes()).padStart(2, "0");
            return `${hours}:${mins}`;
        };

        // 3️⃣ Generate 30-minute slots within all available ranges
        const SLOT_MIN = 15;
        const slots: { start: string; end: string }[] = [];

        for (const avail of availabilities) {
            let current = new Date(avail.available_timestart);

            while (current < avail.available_timeend) {
                const next = new Date(current.getTime() + SLOT_MIN * 60 * 1000);

                if (next <= avail.available_timeend) {
                    // Check if this 30min block conflicts with an appointment
                    const isBlocked = appointments.some((appt) =>
                        overlaps(current, next, appt.appointment_timestart, appt.appointment_timeend)
                    );

                    if (!isBlocked) {
                        slots.push({
                            start: formatTime(current),
                            end: formatTime(next),
                        });
                    }
                }
                current = new Date(current.getTime() + SLOT_MIN * 60 * 1000);
            }
        }

        return NextResponse.json({ slots });
    } catch (err) {
        console.error("[GET /api/meta/doctor-availability]", err);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
