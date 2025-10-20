import { NextResponse } from "next/server";

import { computeSlotsForDoctors } from "@/lib/doctor-availability";
import { prisma } from "@/lib/prisma";
import { startOfManilaDay, endOfManilaDay } from "@/lib/time";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const clinic_id = searchParams.get("clinic_id");
        const doctorIdsParam = searchParams.get("doctor_user_ids");
        const date = searchParams.get("date");

        if (!clinic_id || !doctorIdsParam || !date) {
            return NextResponse.json(
                { message: "clinic_id, doctor_user_ids, and date are required" },
                { status: 400 }
            );
        }

        const doctor_user_ids = Array.from(
            new Set(
                doctorIdsParam
                    .split(",")
                    .map((value) => value.trim())
                    .filter((value) => value.length > 0)
            )
        );

        if (doctor_user_ids.length === 0) {
            return NextResponse.json({ message: "No doctors provided" }, { status: 400 });
        }

        const dayStart = startOfManilaDay(date);
        const dayEnd = endOfManilaDay(date);

        const [availabilities, appointments] = await Promise.all([
            prisma.doctorAvailability.findMany({
                where: {
                    clinic_id,
                    doctor_user_id: { in: doctor_user_ids },
                    available_date: { gte: dayStart, lte: dayEnd },
                },
                orderBy: { available_timestart: "asc" },
            }),
            prisma.appointment.findMany({
                where: {
                    doctor_user_id: { in: doctor_user_ids },
                    appointment_timestart: { gte: dayStart, lte: dayEnd },
                    status: { in: ["Pending", "Approved"] },
                },
                select: {
                    doctor_user_id: true,
                    appointment_timestart: true,
                    appointment_timeend: true,
                },
            }),
        ]);

        const availability = computeSlotsForDoctors(availabilities, appointments);

        for (const doctorId of doctor_user_ids) {
            availability[doctorId] = availability[doctorId] ?? [];
        }

        return NextResponse.json({ availability });
    } catch (err) {
        console.error("[GET /api/meta/doctor-availability/bulk]", err);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
