import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus, Role, Prisma } from "@prisma/client";
import {
    addManilaDays,
    buildManilaDate,
    endOfManilaDay,
    manilaDateISO,
    manilaNow,
    rangesOverlap,
    startOfManilaDay,
    startOfManilaWeek,
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

        return NextResponse.json(slots);
    } catch (err) {
        console.error("[GET /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to fetch consultation slots" },
            { status: 500 }
        );
    }
}

/**
 * ✅ POST — Create new consultation slot (Manila-local)
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctor = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { user_id: true, role: true, specialization: true },
        });

        if (!doctor || doctor.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const {
            clinic_id,
            start_time,
            end_time,
            week_start,
            available_date,
        } = await req.json();

        if (!clinic_id || !start_time || !end_time) {
            return NextResponse.json({ error: "Start and end time are required" }, { status: 400 });
        }

        const referenceDateStr =
            week_start || available_date || manilaDateISO(manilaNow());
        const referenceDate = startOfManilaDay(referenceDateStr);
        const weekStart = startOfManilaWeek(referenceDate);
        const totalDays = doctor.specialization === "Dentist" ? 6 : 5; // Mon–Sat vs Mon–Fri

        const startProbe = buildManilaDate(referenceDateStr, start_time);
        const endProbe = buildManilaDate(referenceDateStr, end_time);

        if (endProbe <= startProbe) {
            return NextResponse.json(
                { error: "End time must be after start time" },
                { status: 400 }
            );
        }

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        const now = manilaNow();
        const weekEnd = addManilaDays(weekStart, 7);

        const existing = await prisma.doctorAvailability.findMany({
            where: {
                doctor_user_id: doctor.user_id,
                available_date: { gte: weekStart, lt: weekEnd },
            },
        });

        const appointments = await prisma.appointment.findMany({
            where: {
                doctor_user_id: doctor.user_id,
                appointment_timestart: { gte: weekStart, lt: weekEnd },
                status: { in: [AppointmentStatus.Pending, AppointmentStatus.Approved] },
            },
            select: {
                appointment_timestart: true,
                appointment_timeend: true,
            },
        });

        const slotsToCreate: {
            available_date: Date;
            available_timestart: Date;
            available_timeend: Date;
        }[] = [];
        const conflicts: string[] = [];

        for (let dayOffset = 0; dayOffset < totalDays; dayOffset += 1) {
            const dayDate = addManilaDays(weekStart, dayOffset);
            const dateStr = manilaDateISO(dayDate);
            const slotStart = buildManilaDate(dateStr, start_time);
            const slotEnd = buildManilaDate(dateStr, end_time);

            if (slotEnd <= slotStart) {
                continue;
            }

            if (slotEnd <= now) {
                continue; // Skip past windows
            }

            const hasConflict = existing.some((record) =>
                rangesOverlap(
                    slotStart,
                    slotEnd,
                    record.available_timestart,
                    record.available_timeend
                )
            );

            const appointmentConflict = appointments.some((appt) =>
                rangesOverlap(slotStart, slotEnd, appt.appointment_timestart, appt.appointment_timeend)
            );

            if (hasConflict || appointmentConflict) {
                conflicts.push(dateStr);
                continue;
            }

            slotsToCreate.push({
                available_date: startOfManilaDay(dateStr),
                available_timestart: slotStart,
                available_timeend: slotEnd,
            });
        }

        if (slotsToCreate.length === 0) {
            if (conflicts.length > 0) {
                return NextResponse.json(
                    {
                        error: `Unable to create duty hours. Existing schedules already cover: ${conflicts.join(", ")}`,
                    },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                {
                    error: "No future days available this week for the selected time range",
                },
                { status: 400 }
            );
        }

        const created = await prisma.$transaction(
            slotsToCreate.map((slot) =>
                prisma.doctorAvailability.create({
                    data: {
                        doctor_user_id: doctor.user_id,
                        clinic_id,
                        ...slot,
                    },
                    include: {
                        clinic: { select: { clinic_id: true, clinic_name: true } },
                    },
                })
            )
        );

        return NextResponse.json({ created });
    } catch (err) {
        console.error("[POST /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to add consultation slot" },
            { status: 500 }
        );
    }
}

/**
 * ✅ PUT — Update existing consultation slot (Manila-local)
 */
export async function PUT(req: Request) {
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

        const {
            availability_id,
            available_timestart,
            available_timeend,
            clinic_id,
        } = await req.json();

        if (!availability_id) {
            return NextResponse.json({ error: "Missing availability ID" }, { status: 400 });
        }

        const slot = await prisma.doctorAvailability.findUnique({
            where: { availability_id },
        });

        if (!slot || slot.doctor_user_id !== doctor.user_id) {
            return NextResponse.json({ error: "Availability not found" }, { status: 404 });
        }

        const dateStr = manilaDateISO(slot.available_timestart);
        const newStart = available_timestart
            ? buildManilaDate(dateStr, available_timestart)
            : slot.available_timestart;
        const newEnd = available_timeend
            ? buildManilaDate(dateStr, available_timeend)
            : slot.available_timeend;

        if (newEnd <= newStart) {
            return NextResponse.json(
                { error: "End time must be after start time" },
                { status: 400 }
            );
        }

        const dayStart = startOfManilaDay(dateStr);
        const dayEnd = endOfManilaDay(dateStr);

        const overlapsSameDay = await prisma.doctorAvailability.findMany({
            where: {
                doctor_user_id: doctor.user_id,
                availability_id: { not: availability_id },
                available_timestart: { gte: dayStart, lte: dayEnd },
            },
        });

        const conflict = overlapsSameDay.some((record) =>
            rangesOverlap(newStart, newEnd, record.available_timestart, record.available_timeend)
        );

        if (conflict) {
            return NextResponse.json(
                { error: "This time overlaps with another duty hour" },
                { status: 409 }
            );
        }

        const updateData: Prisma.DoctorAvailabilityUpdateInput = {
            available_timestart: newStart,
            available_timeend: newEnd,
        };

        if (clinic_id) {
            updateData.clinic = { connect: { clinic_id } };
        }

        const updated = await prisma.doctorAvailability.update({
            where: { availability_id },
            data: updateData,
            include: {
                clinic: { select: { clinic_id: true, clinic_name: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("[PUT /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to update consultation slot" },
            { status: 500 }
        );
    }
}
