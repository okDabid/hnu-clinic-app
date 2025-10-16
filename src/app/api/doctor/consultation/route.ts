import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus, DoctorSpecialization, Role, Prisma } from "@prisma/client";
import {
    addManilaDays,
    buildManilaDate,
    formatManilaDate,
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
        });

        if (!doctor || doctor.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { clinic_id, available_timestart, available_timeend, week_start } =
            await req.json();

        if (!clinic_id || !available_timestart || !available_timeend) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        const baseDate = week_start ? startOfManilaDay(week_start) : manilaNow();
        const weekStart = startOfManilaWeek(baseDate);

        const dailyCount =
            doctor.specialization === DoctorSpecialization.Dentist ? 6 : 5; // Mon-Fri or Mon-Sat

        const scheduleDays = Array.from({ length: dailyCount }, (_, idx) => {
            const current = addManilaDays(weekStart, idx);
            const dateStr = formatManilaDate(current);
            const start = buildManilaDate(dateStr, available_timestart);
            const end = buildManilaDate(dateStr, available_timeend);
            return { current, dateStr, start, end };
        });

        if (scheduleDays.some((day) => day.end <= day.start)) {
            return NextResponse.json(
                { error: "End time must be after start time" },
                { status: 400 }
            );
        }

        const rangeStartStr = formatManilaDate(scheduleDays[0].current);
        const rangeEndStr = formatManilaDate(scheduleDays[scheduleDays.length - 1].current);

        const [existingAvailability, existingAppointments] = await Promise.all([
            prisma.doctorAvailability.findMany({
                where: {
                    doctor_user_id: doctor.user_id,
                    available_date: {
                        gte: startOfManilaDay(rangeStartStr),
                        lte: startOfManilaDay(rangeEndStr),
                    },
                },
            }),
            prisma.appointment.findMany({
                where: {
                    doctor_user_id: doctor.user_id,
                    appointment_timestart: {
                        gte: buildManilaDate(rangeStartStr, "00:00"),
                        lte: buildManilaDate(rangeEndStr, "23:59"),
                    },
                    status: {
                        in: [
                            AppointmentStatus.Pending,
                            AppointmentStatus.Approved,
                            AppointmentStatus.Moved,
                        ],
                    },
                },
            }),
        ]);

        const conflicts = scheduleDays.filter((day) =>
            existingAvailability.some((existing) =>
                rangesOverlap(
                    day.start,
                    day.end,
                    existing.available_timestart,
                    existing.available_timeend,
                )
            ) ||
            existingAppointments.some((appt) =>
                rangesOverlap(day.start, day.end, appt.appointment_timestart, appt.appointment_timeend)
            )
        );

        if (conflicts.length > 0) {
            const conflictDates = Array.from(new Set(conflicts.map((day) => day.dateStr))).join(", ");
            return NextResponse.json(
                {
                    error: `Duty hours conflict with existing schedules on: ${conflictDates}`,
                },
                { status: 409 }
            );
        }

        const created = await prisma.$transaction(async (tx) => {
            const rows = [] as {
                availability_id: string;
                available_date: Date;
                available_timestart: Date;
                available_timeend: Date;
                clinic: { clinic_id: string; clinic_name: string };
            }[];

            for (const day of scheduleDays) {
                const row = await tx.doctorAvailability.create({
                    data: {
                        doctor_user_id: doctor.user_id,
                        clinic_id,
                        available_date: startOfManilaDay(day.dateStr),
                        available_timestart: day.start,
                        available_timeend: day.end,
                    },
                    include: {
                        clinic: { select: { clinic_id: true, clinic_name: true } },
                    },
                });
                rows.push(row);
            }

            return rows;
        });

        return NextResponse.json(created);
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
            clinic_id,
            available_date,
            available_timestart,
            available_timeend,
        } = await req.json();

        if (!availability_id) {
            return NextResponse.json({ error: "Missing availability ID" }, { status: 400 });
        }

        const existing = await prisma.doctorAvailability.findUnique({
            where: { availability_id },
        });

        if (!existing || existing.doctor_user_id !== doctor.user_id) {
            return NextResponse.json({ error: "Availability not found" }, { status: 404 });
        }

        const effectiveDate = available_date ?? formatManilaDate(existing.available_date);
        const newStart = available_timestart
            ? buildManilaDate(effectiveDate, available_timestart)
            : existing.available_timestart;
        const newEnd = available_timeend
            ? buildManilaDate(effectiveDate, available_timeend)
            : existing.available_timeend;

        if (newEnd <= newStart) {
            return NextResponse.json(
                { error: "End time must be after start time" },
                { status: 400 }
            );
        }

        const conflictingAvail = await prisma.doctorAvailability.findMany({
            where: {
                availability_id: { not: availability_id },
                doctor_user_id: doctor.user_id,
                available_date: {
                    gte: startOfManilaDay(effectiveDate),
                    lte: startOfManilaDay(effectiveDate),
                },
            },
        });

        const hasConflict = conflictingAvail.some((slot) =>
            rangesOverlap(newStart, newEnd, slot.available_timestart, slot.available_timeend)
        );

        if (hasConflict) {
            return NextResponse.json(
                { error: "Updated schedule overlaps with an existing duty hour" },
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

        if (available_date) {
            updateData.available_date = startOfManilaDay(available_date);
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
