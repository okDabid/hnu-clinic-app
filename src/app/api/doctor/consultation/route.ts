import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma, DoctorSpecialization } from "@prisma/client";
import {
    buildManilaDate,
    startOfManilaDay,
    manilaNow,
    toManilaDateString,
} from "@/lib/time";

function getUpcomingWeekday(base: Date, targetDow: number) {
    const result = new Date(base);
    const baseDow = result.getUTCDay();
    const diff = (targetDow - baseDow + 7) % 7;
    result.setUTCDate(result.getUTCDate() + diff);
    return result;
}

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

        const { clinic_id, start_time, end_time } = await req.json();

        if (!clinic_id || !start_time || !end_time) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const baseDateString = toManilaDateString(manilaNow().toISOString());
        const startCheck = buildManilaDate(baseDateString, start_time);
        const endCheck = buildManilaDate(baseDateString, end_time);

        if (endCheck <= startCheck) {
            return NextResponse.json(
                { error: "End time must be after start time" },
                { status: 400 }
            );
        }

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        const specialization = doctor.specialization ?? DoctorSpecialization.Physician;
        const allowedWeekdays =
            specialization === DoctorSpecialization.Dentist
                ? [1, 2, 3, 4, 5, 6]
                : [1, 2, 3, 4, 5];

        const nowManila = manilaNow();
        const upcomingMonday = getUpcomingWeekday(nowManila, 1);

        const dateStrings = allowedWeekdays.map((weekday) => {
            const target = new Date(upcomingMonday);
            target.setUTCDate(target.getUTCDate() + (weekday - 1));
            return toManilaDateString(target.toISOString());
        });

        const rangeStart = startOfManilaDay(dateStrings[0]);
        const rangeEnd = startOfManilaDay(dateStrings[dateStrings.length - 1]);
        rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

        const created = await prisma.$transaction(async (tx) => {
            await tx.doctorAvailability.deleteMany({
                where: {
                    doctor_user_id: doctor.user_id,
                    clinic_id,
                    available_date: {
                        gte: rangeStart,
                        lt: rangeEnd,
                    },
                },
            });

            const results = [] as {
                availability_id: string;
                available_date: Date;
                available_timestart: Date;
                available_timeend: Date;
                clinic: { clinic_id: string; clinic_name: string };
            }[];

            for (const dateStr of dateStrings) {
                const record = await tx.doctorAvailability.create({
                    data: {
                        doctor_user_id: doctor.user_id,
                        clinic_id,
                        available_date: startOfManilaDay(dateStr),
                        available_timestart: buildManilaDate(dateStr, start_time),
                        available_timeend: buildManilaDate(dateStr, end_time),
                    },
                    include: {
                        clinic: { select: { clinic_id: true, clinic_name: true } },
                    },
                });
                results.push(record);
            }

            return results;
        });

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
