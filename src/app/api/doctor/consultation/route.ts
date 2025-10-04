import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";

/**
 * 🧭 Helper: Converts date (YYYY-MM-DD) + time (HH:mm)
 * to a Date object in *local* time — avoids UTC offset issues.
 */
function toLocalDate(date: string, time: string): Date {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const d = new Date();
    d.setFullYear(year, month - 1, day);
    d.setHours(hour, minute, 0, 0);
    return d;
}

/**
 * ✅ GET — Fetch doctor’s consultation availability
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

        const availability = await prisma.doctorAvailability.findMany({
            where: { doctor_user_id: doctor.user_id },
            include: { clinic: true },
            orderBy: [
                { available_date: "asc" },
                { available_timestart: "asc" },
            ],
        });

        return NextResponse.json(availability);
    } catch (err) {
        console.error("[GET /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to fetch consultation slots" },
            { status: 500 }
        );
    }
}

/**
 * ✅ POST — Add new doctor duty hours
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
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 🕒 Convert to local timestamps
        const startDate = toLocalDate(available_date, available_timestart);
        const endDate = toLocalDate(available_date, available_timeend);

        // Validate time logic
        if (endDate <= startDate) {
            return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
        }

        // Verify clinic exists
        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        const newAvailability = await prisma.doctorAvailability.create({
            data: {
                doctor_user_id: doctor.user_id,
                clinic_id,
                available_date: new Date(available_date),
                available_timestart: startDate,
                available_timeend: endDate,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Duty hours successfully added",
            data: newAvailability,
        });
    } catch (err) {
        console.error("[POST /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to add duty hours" },
            { status: 500 }
        );
    }
}

/**
 * ✅ PUT — Update existing availability (edit slot)
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

        const { availability_id, available_date, available_timestart, available_timeend } = await req.json();

        if (!availability_id) {
            return NextResponse.json({ error: "Missing availability ID" }, { status: 400 });
        }

        const updateData: Prisma.DoctorAvailabilityUpdateInput = {};

        if (available_date) updateData.available_date = new Date(available_date);
        if (available_timestart && available_date)
            updateData.available_timestart = toLocalDate(available_date, available_timestart);
        if (available_timeend && available_date)
            updateData.available_timeend = toLocalDate(available_date, available_timeend);

        const updated = await prisma.doctorAvailability.update({
            where: { availability_id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message: "Availability updated successfully",
            data: updated,
        });
    } catch (err) {
        console.error("[PUT /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to update schedule" },
            { status: 500 }
        );
    }
}
