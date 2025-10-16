import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma, DoctorSpecialization } from "@prisma/client";
import { buildManilaDate, endOfManilaDay, manilaNow, startOfManilaDay } from "@/lib/time";

const MANILA_WEEKDAY_MAP: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
};

function getManilaWeekday(date: Date): number {
    const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        weekday: "short",
    }).format(date);
    return MANILA_WEEKDAY_MAP[weekday];
}

function addUtcDays(date: Date, days: number) {
    const clone = new Date(date.getTime());
    clone.setUTCDate(clone.getUTCDate() + days);
    return clone;
}

function formatManilaDate(date: Date): string {
    return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

type AvailabilityWithClinic = Prisma.DoctorAvailabilityGetPayload<{
    include: { clinic: { select: { clinic_id: true; clinic_name: true } } };
}>;

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

        const { clinic_id, available_timestart, available_timeend } = await req.json();

        if (!clinic_id || !available_timestart || !available_timeend) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        const now = manilaNow();
        const currentWeekday = getManilaWeekday(now);
        const daysUntilMonday = (1 - currentWeekday + 7) % 7;
        const monday = addUtcDays(now, daysUntilMonday);
        const scheduleLength =
            doctor.specialization === DoctorSpecialization.Dentist ? 6 : 5;

        const scheduleDates: string[] = [];
        for (let i = 0; i < scheduleLength; i++) {
            const day = addUtcDays(monday, i);
            scheduleDates.push(formatManilaDate(day));
        }

        const firstDate = scheduleDates[0];
        const lastDate = scheduleDates[scheduleDates.length - 1];
        const sampleStart = buildManilaDate(firstDate, available_timestart);
        const sampleEnd = buildManilaDate(firstDate, available_timeend);

        if (sampleEnd <= sampleStart) {
            return NextResponse.json(
                { error: "End time must be after start time" },
                { status: 400 }
            );
        }

        const results = await prisma.$transaction(async (tx) => {
            await tx.doctorAvailability.deleteMany({
                where: {
                    doctor_user_id: doctor.user_id,
                    clinic_id,
                    available_date: {
                        gte: startOfManilaDay(firstDate),
                        lte: endOfManilaDay(lastDate),
                    },
                },
            });

            const created: AvailabilityWithClinic[] = [];

            for (const date of scheduleDates) {
                const dayStart = startOfManilaDay(date);
                const start = buildManilaDate(date, available_timestart);
                const end = buildManilaDate(date, available_timeend);

                const slot = await tx.doctorAvailability.create({
                    data: {
                        doctor_user_id: doctor.user_id,
                        clinic_id,
                        available_date: dayStart,
                        available_timestart: start,
                        available_timeend: end,
                    },
                    include: {
                        clinic: { select: { clinic_id: true, clinic_name: true } },
                    },
                });

                created.push(slot);
            }

            return created;
        });

        return NextResponse.json({
            message:
                doctor.specialization === DoctorSpecialization.Dentist
                    ? "Duty hours generated from Monday to Saturday"
                    : "Duty hours generated from Monday to Friday",
            slots: results,
        });
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
