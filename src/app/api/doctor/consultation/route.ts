import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DoctorSpecialization, Prisma, Role } from "@prisma/client";
import {
    buildManilaDate,
    endOfManilaDay,
    formatManilaISODate,
    getManilaWeekday,
    manilaNow,
    startOfManilaDay,
} from "@/lib/time";
const DEFAULT_WEEKS = 4;
const MAX_WEEKS = 12;

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

        const {
            clinic_id,
            available_timestart,
            available_timeend,
            weeks = DEFAULT_WEEKS,
        } = await req.json();

        if (!clinic_id || !available_timestart || !available_timeend) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const sampleDate = "2000-01-01";
        const sampleStart = buildManilaDate(sampleDate, available_timestart);
        const sampleEnd = buildManilaDate(sampleDate, available_timeend);

        if (sampleEnd <= sampleStart) {
            return NextResponse.json(
                { error: "End time must be after start time" },
                { status: 400 }
            );
        }

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        const allowedDays = new Set<number>(
            doctor.specialization === DoctorSpecialization.Dentist
                ? [1, 2, 3, 4, 5, 6]
                : [1, 2, 3, 4, 5]
        );

        const scheduleWeeks = Math.max(1, Math.min(Number(weeks) || DEFAULT_WEEKS, MAX_WEEKS));
        const daysToGenerate = scheduleWeeks * 7;

        const base = manilaNow();
        const toCreate: Prisma.DoctorAvailabilityCreateManyInput[] = [];
        const generatedDates: string[] = [];

        for (let i = 0; i < daysToGenerate; i += 1) {
            const current = new Date(base);
            current.setUTCDate(current.getUTCDate() + i);

            const manilaDate = formatManilaISODate(current);
            const weekday = getManilaWeekday(manilaDate);

            if (Number.isNaN(weekday)) continue;

            if (!allowedDays.has(weekday)) continue;

            generatedDates.push(manilaDate);
            toCreate.push({
                doctor_user_id: doctor.user_id,
                clinic_id,
                available_date: startOfManilaDay(manilaDate),
                available_timestart: buildManilaDate(manilaDate, available_timestart),
                available_timeend: buildManilaDate(manilaDate, available_timeend),
            });
        }

        if (toCreate.length === 0) {
            return NextResponse.json(
                {
                    error:
                        "No working days available for the selected timeframe. Check doctor specialization settings.",
                },
                { status: 400 }
            );
        }

        const rangeStart = startOfManilaDay(generatedDates[0]);
        const rangeEnd = endOfManilaDay(generatedDates[generatedDates.length - 1]);

        await prisma.$transaction(async (tx) => {
            await tx.doctorAvailability.deleteMany({
                where: {
                    doctor_user_id: doctor.user_id,
                    clinic_id,
                    available_date: { gte: rangeStart, lte: rangeEnd },
                },
            });

            await tx.doctorAvailability.createMany({ data: toCreate });
        });

        const refreshed = await prisma.doctorAvailability.findMany({
            where: { doctor_user_id: doctor.user_id },
            include: {
                clinic: { select: { clinic_id: true, clinic_name: true } },
            },
            orderBy: [{ available_date: "asc" }, { available_timestart: "asc" }],
        });

        const firstDay = generatedDates[0];
        const lastDay = generatedDates[generatedDates.length - 1];

        return NextResponse.json({
            message: `Duty hours generated for ${generatedDates.length} day${
                generatedDates.length === 1 ? "" : "s"
            } (${firstDay} to ${lastDay}).`,
            slots: refreshed,
        });
    } catch (err) {
        console.error("[POST /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to add consultation slots" },
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
