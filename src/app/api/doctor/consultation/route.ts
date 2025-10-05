import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";

/**
 * 🕒 Convert PH local date + time to UTC Date
 * Manila (UTC+8) → subtract 8 hours
 */
function toPHDateAsUTC(date: string, time: string): Date {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour - 8, minute, 0));
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
            orderBy: [
                { available_date: "asc" },
                { available_timestart: "asc" },
            ],
        });

        return NextResponse.json(slots);
    } catch (err) {
        console.error("[GET /api/doctor/consultation]", err);
        return NextResponse.json({ error: "Failed to fetch consultation slots" }, { status: 500 });
    }
}

/**
 * ✅ POST — Create new consultation slot
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

        const { clinic_id, available_date, available_timestart, available_timeend } = await req.json();

        if (!clinic_id || !available_date || !available_timestart || !available_timeend) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const startUTC = toPHDateAsUTC(available_date, available_timestart);
        const endUTC = toPHDateAsUTC(available_date, available_timeend);

        if (endUTC <= startUTC) {
            return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
        }

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        const newSlot = await prisma.doctorAvailability.create({
            data: {
                doctor_user_id: doctor.user_id,
                clinic_id,
                available_date: new Date(available_date),
                available_timestart: startUTC,
                available_timeend: endUTC,
            },
            include: {
                clinic: { select: { clinic_id: true, clinic_name: true } },
            },
        });

        return NextResponse.json(newSlot);
    } catch (err) {
        console.error("[POST /api/doctor/consultation]", err);
        return NextResponse.json({ error: "Failed to add consultation slot" }, { status: 500 });
    }
}

/**
 * ✅ PUT — Update existing consultation slot
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

        // ✅ Fix: connect relation properly
        if (clinic_id) {
            updateData.clinic = { connect: { clinic_id } };
        }

        if (available_date) {
            updateData.available_date = new Date(available_date);
        }

        if (available_timestart && available_date) {
            updateData.available_timestart = toPHDateAsUTC(available_date, available_timestart);
        }

        if (available_timeend && available_date) {
            updateData.available_timeend = toPHDateAsUTC(available_date, available_timeend);
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
        return NextResponse.json({ error: "Failed to update consultation slot" }, { status: 500 });
    }
}

