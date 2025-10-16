import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import {
    addManilaDays,
    buildManilaDate,
    manilaNow,
    nextManilaMonday,
    startOfManilaDay,
    startOfManilaWeek,
    toManilaISODate,
} from "@/lib/time";

/**
 * ✅ GET — Fetch all consultation slots for logged-in doctor
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctor = await prisma.users.findUnique({
            where: { user_id: session.user.id },
        });

        if (!doctor || doctor.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const slots = await prisma.doctorAvailability.findMany({
            where: { doctor_user_id: doctor.user_id },
            include: {
                clinic: { select: { clinic_id: true, clinic_name: true } },
            },
            orderBy: [{ available_date: "asc" }, { available_timestart: "asc" }],
        });

        return NextResponse.json({
            specialization: doctor.specialization ?? null,
            slots,
        });
    } catch (err) {
        console.error("[GET /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to fetch consultation slots" },
            { status: 500 }
        );
    }
}

/**
 * ✅ POST — Generate duty hours for the upcoming week
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctor = await prisma.users.findUnique({
            where: { user_id: session.user.id },
        });

        if (!doctor || doctor.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { clinic_id, week_of, start_time, end_time } = await req.json();

        if (!clinic_id || !start_time || !end_time) {
            return NextResponse.json(
                { error: "Clinic, start time, and end time are required" },
                { status: 400 }
            );
        }

        if (!/^\d{2}:\d{2}$/.test(start_time) || !/^\d{2}:\d{2}$/.test(end_time)) {
            return NextResponse.json(
                { error: "Time fields must be in HH:mm format" },
                { status: 400 }
            );
        }

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        const baseDate = week_of ? startOfManilaDay(week_of) : nextManilaMonday(manilaNow());
        const reference = startOfManilaWeek(baseDate);
        const totalDays = doctor.specialization === "Dentist" ? 6 : 5;

        const weekDates = Array.from({ length: totalDays }, (_, idx) => addManilaDays(reference, idx));
        const slotsToCreate = weekDates.map((date) => {
            const iso = toManilaISODate(date);
            const dayStart = buildManilaDate(iso, start_time);
            const dayEnd = buildManilaDate(iso, end_time);

            if (dayEnd <= dayStart) {
                throw new Error("invalid-range");
            }

            return {
                iso,
                dayStart,
                dayEnd,
            };
        });

        const weekStart = startOfManilaDay(slotsToCreate[0].iso);
        const weekEnd = addManilaDays(startOfManilaDay(slotsToCreate[slotsToCreate.length - 1].iso), 1);

        const existingAppointments = await prisma.appointment.findMany({
            where: {
                doctor_user_id: doctor.user_id,
                clinic_id,
                appointment_timestart: { gte: weekStart, lt: weekEnd },
                status: { in: ["Pending", "Approved"] },
            },
        });

        const hasConflict = existingAppointments.some((appt) => {
            const dayIso = toManilaISODate(appt.appointment_timestart);
            const slot = slotsToCreate.find((s) => s.iso === dayIso);
            if (!slot) return true;
            return appt.appointment_timestart < slot.dayStart || appt.appointment_timeend > slot.dayEnd;
        });

        if (hasConflict) {
            return NextResponse.json(
                {
                    error: "Existing appointments fall outside the new duty hours. Please resolve them first.",
                },
                { status: 409 }
            );
        }

        await prisma.$transaction([
            prisma.doctorAvailability.deleteMany({
                where: {
                    doctor_user_id: doctor.user_id,
                    clinic_id,
                    available_timestart: { gte: weekStart, lt: weekEnd },
                },
            }),
            prisma.doctorAvailability.createMany({
                data: slotsToCreate.map((slot) => ({
                    doctor_user_id: doctor.user_id,
                    clinic_id,
                    available_date: startOfManilaDay(slot.iso),
                    available_timestart: slot.dayStart,
                    available_timeend: slot.dayEnd,
                })),
            }),
        ]);

        const refreshedSlots = await prisma.doctorAvailability.findMany({
            where: { doctor_user_id: doctor.user_id },
            include: {
                clinic: { select: { clinic_id: true, clinic_name: true } },
            },
            orderBy: [{ available_date: "asc" }, { available_timestart: "asc" }],
        });

        return NextResponse.json({
            specialization: doctor.specialization ?? null,
            slots: refreshedSlots,
        });
    } catch (err) {
        if (err instanceof Error && err.message === "invalid-range") {
            return NextResponse.json(
                { error: "End time must be after start time" },
                { status: 400 }
            );
        }

        console.error("[POST /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to update duty hours" },
            { status: 500 }
        );
    }
}
