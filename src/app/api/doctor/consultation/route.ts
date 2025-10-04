import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";

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

        return NextResponse.json(availability);
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
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const newAvailability = await prisma.doctorAvailability.create({
            data: {
                doctor_user_id: doctor.user_id,
                clinic_id,
                available_date: new Date(available_date),
                available_timestart: new Date(available_timestart),
                available_timeend: new Date(available_timeend),
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
        if (available_timestart) {
            updateData.available_timestart = new Date(available_timestart);
        }
        if (available_timeend) {
            updateData.available_timeend = new Date(available_timeend);
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
        console.error("[PUT /api/doctor/consultation]", err);
        return NextResponse.json(
            { error: "Failed to update schedule" },
            { status: 500 }
        );
    }
}
