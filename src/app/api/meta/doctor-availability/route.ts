import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/withDb";
import { archiveExpiredDutyHours } from "@/lib/duty-hours";
import { startOfManilaDay, endOfManilaDay } from "@/lib/time";

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

        await archiveExpiredDutyHours({ doctor_user_id, clinic_id });

        const [availabilities, appointments] = await withDb(async () =>
            Promise.all([
                prisma.doctorAvailability.findMany({
                    where: {
                        clinic_id,
                        doctor_user_id,
                        archivedAt: null,
                        available_date: { gte: dayStart, lte: dayEnd },
                    },
                    orderBy: { available_timestart: "asc" },
                }),
                prisma.appointment.findMany({
                    where: {
                        doctor_user_id,
                        appointment_timestart: { gte: dayStart, lte: dayEnd },
                        status: { in: ["Pending", "Approved"] },
                    },
                    select: {
                        appointment_timestart: true,
                        appointment_timeend: true,
                    },
                }),
            ])
        );

        if (availabilities.length === 0) {
            return NextResponse.json({ slots: [] });
        }

        const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
            aStart < bEnd && bStart < aEnd;

        // Format to HH:mm in Manila
        const fmtHHmmManila = (d: Date) =>
            new Intl.DateTimeFormat("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Manila",
            }).format(d);

        // 3) Generate 15-minute slots
        const SLOT_MIN = 15;
        const slots: { start: string; end: string }[] = [];

        for (const avail of availabilities) {
            let current = new Date(avail.available_timestart);

            while (current < avail.available_timeend) {
                const next = new Date(current.getTime() + SLOT_MIN * 60 * 1000);

                if (next <= avail.available_timeend) {
                    const isBlocked = appointments.some((appt) =>
                        overlaps(current, next, appt.appointment_timestart, appt.appointment_timeend)
                    );

                    if (!isBlocked) {
                        slots.push({
                            start: fmtHHmmManila(current),
                            end: fmtHHmmManila(next),
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
