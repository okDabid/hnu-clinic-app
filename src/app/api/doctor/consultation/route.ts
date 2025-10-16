import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma, DoctorSpecialization } from "@prisma/client";
import {
    addDays,
    buildManilaDate,
    endOfManilaDay,
    formatAsManilaDate,
    rangesOverlap,
    startOfManilaDay,
    startOfNextOrSameManilaMonday,
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

        if (!doctor.specialization) {
            return NextResponse.json(
                { error: "Doctor specialization is required to set duty hours" },
                { status: 400 }
            );
        }

        const { clinic_id, time_start, time_end } = await req.json();

        if (!clinic_id || !time_start || !time_end) {
            return NextResponse.json({ error: "Clinic and duty hours are required" }, { status: 400 });
        }

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        const upcomingMonday = startOfNextOrSameManilaMonday();
        const activeDays =
            doctor.specialization === DoctorSpecialization.Dentist ? 6 : 5;

        const scheduleDays = Array.from({ length: activeDays }, (_, idx) => {
            const date = addDays(upcomingMonday, idx);
            const dateStr = formatAsManilaDate(date);
            const start = buildManilaDate(dateStr, time_start);
            const end = buildManilaDate(dateStr, time_end);
            return { date, dateStr, start, end };
        });

        for (const slot of scheduleDays) {
            if (slot.end <= slot.start) {
                return NextResponse.json(
                    { error: "Duty end time must be after start time" },
                    { status: 400 }
                );
            }
        }

        const weekStart = scheduleDays[0]?.dateStr;
        const weekEnd = scheduleDays[scheduleDays.length - 1]?.dateStr;

        if (!weekStart || !weekEnd) {
            return NextResponse.json(
                { error: "Unable to determine schedule range" },
                { status: 500 }
            );
        }

        const existingConflicts = await prisma.doctorAvailability.findMany({
            where: {
                doctor_user_id: doctor.user_id,
                clinic_id: { not: clinic_id },
                available_date: {
                    gte: startOfManilaDay(weekStart),
                    lte: endOfManilaDay(weekEnd),
                },
            },
        });

        const conflict = scheduleDays.some((slot) =>
            existingConflicts.some((existing) =>
                rangesOverlap(
                    slot.start,
                    slot.end,
                    existing.available_timestart,
                    existing.available_timeend
                ) &&
                formatAsManilaDate(existing.available_timestart) === slot.dateStr
            )
        );

        if (conflict) {
            return NextResponse.json(
                {
                    error: "Duty hours conflict with existing availability in another clinic",
                },
                { status: 409 }
            );
        }

        const created = await prisma.$transaction(async (tx) => {
            await tx.doctorAvailability.deleteMany({
                where: {
                    doctor_user_id: doctor.user_id,
                    clinic_id,
                    available_date: {
                        gte: startOfManilaDay(weekStart),
                        lte: endOfManilaDay(weekEnd),
                    },
                },
            });

            const entries = await Promise.all(
                scheduleDays.map((slot) =>
                    tx.doctorAvailability.create({
                        data: {
                            doctor_user_id: doctor.user_id,
                            clinic_id,
                            available_date: startOfManilaDay(slot.dateStr),
                            available_timestart: slot.start,
                            available_timeend: slot.end,
                        },
                        include: {
                            clinic: { select: { clinic_id: true, clinic_name: true } },
                        },
                    })
                )
            );

            return entries;
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

        const updateData: Prisma.DoctorAvailabilityUpdateInput = {};

        if (clinic_id) {
            updateData.clinic = { connect: { clinic_id } };
        }

        if (available_date) {
            updateData.available_date = startOfManilaDay(available_date);
        }

        if (available_timestart && available_date) {
            updateData.available_timestart = buildManilaDate(available_date, available_timestart);
        }
        if (available_timeend && available_date) {
            updateData.available_timeend = buildManilaDate(available_date, available_timeend);
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
