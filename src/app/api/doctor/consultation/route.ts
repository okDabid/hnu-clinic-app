import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DoctorSpecialization, Prisma, Role } from "@prisma/client";
import { archiveExpiredDutyHours } from "@/lib/duty-hours";
import {
    buildManilaDate,
    endOfManilaDay,
    formatManilaISODate,
    getManilaWeekday,
    manilaNow,
    rangesOverlap,
    startOfManilaDay,
    toManilaTimeString,
} from "@/lib/time";

function getCurrentMonthStart(): Date {
    const now = manilaNow();
    const today = formatManilaISODate(now);
    const [year, month] = today.split("-");
    const monthStartDate = `${year}-${month}-01`;
    return startOfManilaDay(monthStartDate);
}

function getGenerationEndExclusive(start: Date): Date {
    const startYear = Number.parseInt(formatManilaISODate(start).slice(0, 4), 10);
    const januaryNextYear = `${startYear + 1}-01-01`;
    return startOfManilaDay(januaryNextYear);
}

function resolveCalendarMonthRange(monthParam: string | null) {
    const fallbackMonth = formatManilaISODate(manilaNow()).slice(0, 7);
    const MONTH_PARAM_PATTERN = /^\d{4}-\d{2}$/;
    const monthKey = monthParam && MONTH_PARAM_PATTERN.test(monthParam) ? monthParam : fallbackMonth;
    const monthStart = startOfManilaDay(`${monthKey}-01`);
    const nextMonth = new Date(monthStart);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    const nextMonthKey = formatManilaISODate(nextMonth).slice(0, 7);
    const monthEndExclusive = startOfManilaDay(`${nextMonthKey}-01`);

    return { monthKey, monthStart, monthEndExclusive };
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * GET — Fetch all consultation slots for logged-in doctor
 */
export async function GET(req: Request) {
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

        await archiveExpiredDutyHours({ doctor_user_id: doctor.user_id });

        const url = new URL(req.url);
        const view = url.searchParams.get("view");

        if (view === "calendar") {
            const { monthKey, monthStart, monthEndExclusive } = resolveCalendarMonthRange(
                url.searchParams.get("month")
            );

            const slots = await prisma.doctorAvailability.findMany({
                where: {
                    doctor_user_id: doctor.user_id,
                    archivedAt: null,
                    available_date: { gte: monthStart, lt: monthEndExclusive },
                },
                include: {
                    clinic: { select: { clinic_id: true, clinic_name: true } },
                },
                orderBy: [{ available_date: "asc" }, { available_timestart: "asc" }],
            });

            return NextResponse.json({ month: monthKey, slots });
        }

        const pageParam = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
        const pageSizeParam = Number.parseInt(url.searchParams.get("pageSize") ?? "25", 10);

        const pageSize = Number.isNaN(pageSizeParam)
            ? 25
            : Math.min(Math.max(pageSizeParam, 5), 100);
        const requestedPage = Number.isNaN(pageParam) ? 1 : Math.max(pageParam, 1);

        const where: Prisma.DoctorAvailabilityWhereInput = {
            doctor_user_id: doctor.user_id,
            archivedAt: null,
        };

        const total = await prisma.doctorAvailability.count({ where });
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const page = Math.min(requestedPage, totalPages);
        const skip = (page - 1) * pageSize;

        const slots = await prisma.doctorAvailability.findMany({
            where,
            include: {
                clinic: { select: { clinic_id: true, clinic_name: true } },
            },
            orderBy: [{ available_date: "asc" }, { available_timestart: "asc" }],
            skip,
            take: pageSize,
        });

        return NextResponse.json({ data: slots, page, pageSize, total, totalPages });
    } catch (err) {
        console.error("[GET /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to fetch consultation slots" },
            { status: 500 }
        );
    }
}

/**
 * POST — Create new consultation slot (Manila-local)
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

        await archiveExpiredDutyHours({ doctor_user_id: doctor.user_id });

        const {
            clinic_id,
            available_timestart,
            available_timeend,
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

        const monthStart = getCurrentMonthStart();
        const endExclusive = getGenerationEndExclusive(monthStart);
        const toCreate: Prisma.DoctorAvailabilityCreateManyInput[] = [];
        const generatedDates: string[] = [];
        const candidateSlots: {
            date: string;
            start: Date;
            end: Date;
        }[] = [];

        for (
            let cursor = new Date(monthStart);
            cursor < endExclusive;
            cursor = new Date(cursor.getTime() + DAY_IN_MS)
        ) {
            const manilaDate = formatManilaISODate(cursor);
            const weekday = getManilaWeekday(manilaDate);

            if (Number.isNaN(weekday)) continue;

            if (!allowedDays.has(weekday)) continue;

            const slotStart = buildManilaDate(manilaDate, available_timestart);
            const slotEnd = buildManilaDate(manilaDate, available_timeend);

            generatedDates.push(manilaDate);
            toCreate.push({
                doctor_user_id: doctor.user_id,
                clinic_id,
                available_date: startOfManilaDay(manilaDate),
                available_timestart: slotStart,
                available_timeend: slotEnd,
                is_on_leave: false,
                archivedAt: null,
            });

            candidateSlots.push({
                date: manilaDate,
                start: slotStart,
                end: slotEnd,
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

        const rangeStart = monthStart;
        const lastGeneratedDate = generatedDates[generatedDates.length - 1];
        const rangeEnd = lastGeneratedDate
            ? endOfManilaDay(lastGeneratedDate)
            : endOfManilaDay(
                  formatManilaISODate(new Date(endExclusive.getTime() - DAY_IN_MS))
              );

        const existingForYear = await prisma.doctorAvailability.count({
            where: {
                doctor_user_id: doctor.user_id,
                archivedAt: null,
                available_date: { gte: rangeStart, lt: endExclusive },
            },
        });

        if (existingForYear > 0) {
            const currentYear = formatManilaISODate(rangeStart).slice(0, 4);
            return NextResponse.json(
                {
                    error: `Duty hours for ${currentYear} have already been generated. Edit existing slots instead of creating a new set.`,
                },
                { status: 409 }
            );
        }

        const conflicting = await prisma.doctorAvailability.findMany({
            where: {
                doctor_user_id: doctor.user_id,
                archivedAt: null,
                clinic_id: { not: clinic_id },
                available_date: { gte: rangeStart, lte: rangeEnd },
            },
            select: {
                availability_id: true,
                clinic_id: true,
                available_date: true,
                available_timestart: true,
                available_timeend: true,
            },
        });

        for (const candidate of candidateSlots) {
            const candidateDate = candidate.date;
            for (const existing of conflicting) {
                const existingDate = formatManilaISODate(existing.available_date);
                if (existingDate !== candidateDate) continue;

                if (
                    rangesOverlap(
                        candidate.start,
                        candidate.end,
                        existing.available_timestart,
                        existing.available_timeend,
                    )
                ) {
                    const conflictStart = formatManilaISODate(existing.available_date);
                    const conflictStartTime = toManilaTimeString(
                        existing.available_timestart.toISOString(),
                    );
                    const conflictEndTime = toManilaTimeString(
                        existing.available_timeend.toISOString(),
                    );
                    return NextResponse.json(
                        {
                            error: `Conflict detected with an existing duty hour on ${conflictStart} from ${conflictStartTime} to ${conflictEndTime}. Adjust the time range to avoid overlaps across clinics.`,
                        },
                        { status: 409 },
                    );
                }
            }
        }

        await prisma.$transaction(async (tx) => {
            await tx.doctorAvailability.deleteMany({
                where: {
                    doctor_user_id: doctor.user_id,
                    clinic_id,
                    archivedAt: null,
                    available_date: { gte: rangeStart, lte: rangeEnd },
                },
            });

            await tx.doctorAvailability.createMany({ data: toCreate });
        });

        await archiveExpiredDutyHours({ doctor_user_id: doctor.user_id });

        const firstDay = generatedDates[0] ?? formatManilaISODate(monthStart);
        const lastDay =
            generatedDates[generatedDates.length - 1] ??
            formatManilaISODate(new Date(endExclusive.getTime() - DAY_IN_MS));

        return NextResponse.json({
            message: `Duty hours generated for ${generatedDates.length} day${
                generatedDates.length === 1 ? "" : "s"
            } (${firstDay} to ${lastDay}).`,
            createdCount: generatedDates.length,
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
 * PUT — Update existing consultation slot (Manila-local)
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

        await archiveExpiredDutyHours({ doctor_user_id: doctor.user_id });

        const {
            availability_id,
            clinic_id,
            available_date,
            available_timestart,
            available_timeend,
            is_on_leave,
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

        if (existing.archivedAt) {
            return NextResponse.json(
                { error: "This duty hour has already been archived" },
                { status: 400 },
            );
        }

        const targetClinicId = clinic_id ?? existing.clinic_id;

        if (clinic_id) {
            const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
            if (!clinic) {
                return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
            }
        }

        const targetDate = available_date ?? formatManilaISODate(existing.available_date);

        const targetStartTime = available_timestart
            ? available_timestart
            : toManilaTimeString(existing.available_timestart.toISOString());

        const targetEndTime = available_timeend
            ? available_timeend
            : toManilaTimeString(existing.available_timeend.toISOString());

        const targetIsOnLeave = typeof is_on_leave === "boolean" ? is_on_leave : existing.is_on_leave;

        if (!targetStartTime || !targetEndTime) {
            return NextResponse.json(
                { error: "Start and end times are required" },
                { status: 400 },
            );
        }

        const newStart = buildManilaDate(targetDate, targetStartTime);
        const newEnd = buildManilaDate(targetDate, targetEndTime);

        if (!(newStart < newEnd)) {
            return NextResponse.json(
                { error: "End time must be after start time" },
                { status: 400 },
            );
        }

        const dayStart = startOfManilaDay(targetDate);
        const dayEnd = endOfManilaDay(targetDate);

        const conflicts = await prisma.doctorAvailability.findMany({
            where: {
                doctor_user_id: doctor.user_id,
                archivedAt: null,
                availability_id: { not: availability_id },
                available_date: { gte: dayStart, lte: dayEnd },
            },
        });

        const hasOverlap = conflicts.some((entry) =>
            rangesOverlap(newStart, newEnd, entry.available_timestart, entry.available_timeend),
        );

        if (hasOverlap) {
            return NextResponse.json(
                { error: "Updated time overlaps with another duty hour" },
                { status: 409 },
            );
        }

        const updateData: Prisma.DoctorAvailabilityUpdateInput = {
            clinic: { connect: { clinic_id: targetClinicId } },
            available_date: dayStart,
            available_timestart: newStart,
            available_timeend: newEnd,
            is_on_leave: targetIsOnLeave,
            archivedAt: null,
        };

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
