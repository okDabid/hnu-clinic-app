import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";

// ✅ Helper: safely combine date + time into a proper ISO string
function combineDateTime(date: string, time: string): Date {
    const iso = `${date}T${time}:00`;
    const parsed = new Date(iso);
    if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid date/time format: ${iso}`);
    }
    return parsed;
}

// ✅ GET — Fetch doctor’s availability slots
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctor = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { employee: true },
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

        // ✅ Format time display for frontend (local-friendly)
        const formatted = availability.map((slot) => ({
            ...slot,
            available_timestart: new Date(slot.available_timestart).toISOString(),
            available_timeend: new Date(slot.available_timeend).toISOString(),
        }));

        return NextResponse.json(formatted);
    } catch (err) {
        console.error("[GET /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to fetch consultation slots" },
            { status: 500 }
        );
    }
}

// ✅ POST — Create doctor availability (input duty hours)
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

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        // ✅ Properly combine date + time
        const dateOnly = new Date(available_date);
        const startDate = combineDateTime(available_date, available_timestart);
        const endDate = combineDateTime(available_date, available_timeend);

        const newAvailability = await prisma.doctorAvailability.create({
            data: {
                doctor_user_id: doctor.user_id,
                clinic_id,
                available_date: dateOnly,
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
        console.error("[POST /api/doctor/consultation] Detailed error:", err);
        return NextResponse.json(
            { error: "Failed to add duty hours", details: String(err) },
            { status: 500 }
        );
    }
}

// ✅ PUT — Modify or approve existing schedule
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

        const { availability_id, available_date, available_timestart, available_timeend } =
            await req.json();

        if (!availability_id) {
            return NextResponse.json({ error: "Missing availability ID" }, { status: 400 });
        }

        const updateData: Prisma.DoctorAvailabilityUpdateInput = {};

        if (available_date) {
            updateData.available_date = new Date(available_date);
        }
        if (available_date && available_timestart) {
            updateData.available_timestart = combineDateTime(available_date, available_timestart);
        }
        if (available_date && available_timeend) {
            updateData.available_timeend = combineDateTime(available_date, available_timeend);
        }

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
        console.error("[PUT /api/doctor/consultation] Detailed error:", err);
        return NextResponse.json(
            { error: "Failed to update schedule", details: String(err) },
            { status: 500 }
        );
    }
}
