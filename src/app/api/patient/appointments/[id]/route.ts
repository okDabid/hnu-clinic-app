import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import {
    buildManilaDate,
    endOfManilaDay,
    manilaNow,
    rangesOverlap,
    startOfManilaDay,
} from "@/lib/time";

// ✅ Define allowed statuses for modification (reschedule/cancel)
const cancellableStatuses: AppointmentStatus[] = [
    AppointmentStatus.Pending,
    AppointmentStatus.Approved,
    AppointmentStatus.Moved,
];

// ✅ Helper function for type-safe cancellation/rescheduling check
function isCancellable(status: AppointmentStatus): boolean {
    return cancellableStatuses.includes(status);
}

// ------------------------------------------------------------
// PATCH — Reschedule an Appointment
// ------------------------------------------------------------
export async function PATCH(
    req: Request,
    context: { params: { id: string } }
) {
    try {
        const { params } = context;
        const session = await getServerSession(authOptions);

        // 1️⃣ Ensure authenticated
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2️⃣ Validate request body
        const body = await req.json();
        const { date, time_start, time_end } = body || {};

        if (!date || !time_start || !time_end) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        // 3️⃣ Fetch appointment
        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id: params.id },
        });

        // 4️⃣ Verify ownership
        if (!appointment || appointment.patient_user_id !== session.user.id) {
            return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
        }

        // 5️⃣ Ensure appointment is reschedulable
        if (!isCancellable(appointment.status)) {
            return NextResponse.json(
                { message: "Appointment can no longer be rescheduled" },
                { status: 400 }
            );
        }

        // 6️⃣ Validate time inputs
        const appointment_timestart = buildManilaDate(date, time_start);
        const appointment_timeend = buildManilaDate(date, time_end);

        if (appointment_timeend <= appointment_timestart) {
            return NextResponse.json({ message: "Invalid time range" }, { status: 400 });
        }

        // 7️⃣ Ensure booking is at least 3 days in advance
        const now = manilaNow();
        const diffMs = appointment_timestart.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays < 3) {
            return NextResponse.json(
                { message: "Appointments must be booked at least 3 days in advance" },
                { status: 400 }
            );
        }

        // 8️⃣ Get doctor’s availability for that day
        const dayStart = startOfManilaDay(date);
        const dayEnd = endOfManilaDay(date);

        const availabilities = await prisma.doctorAvailability.findMany({
            where: {
                doctor_user_id: appointment.doctor_user_id,
                clinic_id: appointment.clinic_id,
                available_date: { gte: dayStart, lte: dayEnd },
            },
        });

        const withinAvailability = availabilities.some(
            (av) =>
                appointment_timestart >= av.available_timestart &&
                appointment_timeend <= av.available_timeend
        );

        if (!withinAvailability) {
            return NextResponse.json(
                { message: "Selected time is outside doctor's availability" },
                { status: 400 }
            );
        }

        // 9️⃣ Check for conflicts with other appointments
        const conflictingAppointments = await prisma.appointment.findMany({
            where: {
                appointment_id: { not: appointment.appointment_id },
                doctor_user_id: appointment.doctor_user_id,
                appointment_timestart: { gte: dayStart, lte: dayEnd },
                status: {
                    in: cancellableStatuses, // ✅ uses same list for consistency
                },
            },
        });

        const conflict = conflictingAppointments.some((existing) =>
            rangesOverlap(
                appointment_timestart,
                appointment_timeend,
                existing.appointment_timestart,
                existing.appointment_timeend
            )
        );

        if (conflict) {
            return NextResponse.json({ message: "Time slot already booked" }, { status: 409 });
        }

        // 🔟 Update appointment to new time (status reset to Pending)
        const updated = await prisma.appointment.update({
            where: { appointment_id: appointment.appointment_id },
            data: {
                appointment_date: dayStart,
                appointment_timestart,
                appointment_timeend,
                status: AppointmentStatus.Pending,
            },
            select: {
                appointment_id: true,
                appointment_date: true,
                appointment_timestart: true,
                appointment_timeend: true,
                status: true,
            },
        });

        return NextResponse.json({
            id: updated.appointment_id,
            status: updated.status,
        });
    } catch (error) {
        console.error("[PATCH /api/patient/appointments/:id]", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// ------------------------------------------------------------
// DELETE — Cancel an Appointment
// ------------------------------------------------------------
export async function DELETE(
    _req: Request,
    context: { params: { id: string } }
) {
    try {
        const { params } = context;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id: params.id },
        });

        if (!appointment || appointment.patient_user_id !== session.user.id) {
            return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
        }

        if (!isCancellable(appointment.status)) {
            return NextResponse.json(
                { message: "Appointment can no longer be cancelled" },
                { status: 400 }
            );
        }

        await prisma.appointment.update({
            where: { appointment_id: appointment.appointment_id },
            data: { status: AppointmentStatus.Cancelled },
        });

        return NextResponse.json({ message: "Appointment cancelled" });
    } catch (error) {
        console.error("[DELETE /api/patient/appointments/:id]", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

