import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";
import {
    buildManilaDate,
    startOfManilaDay,
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
            orderBy: [
                { available_date: "asc" },
                { available_timestart: "asc" },
            ],
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

        const { clinic_id, available_date, available_timestart, available_timeend } =
            await req.json();

        if (!clinic_id || !available_date || !available_timestart || !available_timeend) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const start = buildManilaDate(available_date, available_timestart);
        const end = buildManilaDate(available_date, available_timeend);

        if (end <= start) {
            return NextResponse.json(
                { error: "End time must be after start time" },
                { status: 400 }
            );
        }

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        const newSlot = await prisma.doctorAvailability.create({
            data: {
                doctor_user_id: doctor.user_id,
                clinic_id,
                available_date: buildManilaDate(available_date, "00:00"),
                available_timestart: start,
                available_timeend: end,
            },
            include: {
                clinic: { select: { clinic_id: true, clinic_name: true } },
            },
        });

        return NextResponse.json(newSlot);
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
            return NextResponse.json(
                { error: "Missing availability ID" },
                { status: 400 }
            );
        }

        const updateData: Prisma.DoctorAvailabilityUpdateInput = {};

        // Connect clinic relation if provided
        if (clinic_id) {
            updateData.clinic = { connect: { clinic_id } };
        }

        // Update date
        if (available_date) {
            updateData.available_date = startOfManilaDay(available_date);
        }

        // Update time range (use consistent Manila conversion)
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
