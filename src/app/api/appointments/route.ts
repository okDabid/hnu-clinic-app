import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, AppointmentStatus, Prisma } from "@prisma/client";

/**
 * GET /api/doctor/appointments
 * Returns all appointments for the logged-in doctor.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ✅ Verify doctor
        const doctor = await prisma.users.findUnique({
            where: { user_id: session.user.id },
        });

        if (!doctor || doctor.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const appointments = await prisma.appointment.findMany({
            where: { doctor_user_id: doctor.user_id },
            include: {
                patient: {
                    include: {
                        student: true,
                        employee: true,
                    },
                },
                clinic: true,
            },
            orderBy: [
                { appointment_date: "asc" },
                { appointment_timestart: "asc" },
            ],
        });

        return NextResponse.json(appointments);
    } catch (err) {
        console.error("[GET /api/doctor/appointments]", err);
        return NextResponse.json(
            { error: "Failed to fetch appointments" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/doctor/appointments
 * Updates the status or timing of an appointment.
 * Body: { appointment_id, status?, appointment_date?, appointment_timestart?, appointment_timeend? }
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

        const payload = await req.json();
        const { appointment_id, status, appointment_date, appointment_timestart, appointment_timeend } = payload;

        if (!appointment_id) {
            return NextResponse.json({ error: "Missing appointment ID" }, { status: 400 });
        }

        // Build update data safely
        const updateData: Prisma.AppointmentUpdateInput = {};
        if (status && Object.values(AppointmentStatus).includes(status)) {
            updateData.status = status;
        }
        if (appointment_date) {
            updateData.appointment_date = new Date(appointment_date);
        }
        if (appointment_timestart) {
            updateData.appointment_timestart = new Date(appointment_timestart);
        }
        if (appointment_timeend) {
            updateData.appointment_timeend = new Date(appointment_timeend);
        }

        const updated = await prisma.appointment.update({
            where: { appointment_id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message: "Appointment updated successfully",
            data: updated,
        });
    } catch (err) {
        console.error("[PUT /api/doctor/appointments]", err);
        return NextResponse.json(
            { error: "Failed to update appointment" },
            { status: 500 }
        );
    }
}
