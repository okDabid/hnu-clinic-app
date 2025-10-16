import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    addManilaDays,
    buildManilaDate,
    endOfManilaDay,
    manilaNow,
    rangesOverlap,
    startOfManilaDay,
} from "@/lib/time";
import { AppointmentStatus } from "@prisma/client";

export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id: id },
        });

        if (!appointment || appointment.patient_user_id !== session.user.id) {
            return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
        }

        if (["Completed", "Cancelled"].includes(appointment.status)) {
            return NextResponse.json(
                { message: "This appointment can no longer be modified" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { action } = body as { action?: string };

        if (action === "cancel") {
            const cancelled = await prisma.appointment.update({
                where: { appointment_id: id },
                data: { status: AppointmentStatus.Cancelled },
            });

            return NextResponse.json({ status: cancelled.status });
        }

        if (action !== "reschedule") {
            return NextResponse.json({ message: "Invalid action" }, { status: 400 });
        }

        const { date, time_start, time_end } = body as {
            date?: string;
            time_start?: string;
            time_end?: string;
        };

        if (!date || !time_start || !time_end) {
            return NextResponse.json(
                { message: "Date and time are required to reschedule" },
                { status: 400 }
            );
        }

        const appointment_date = startOfManilaDay(date);
        const appointment_timestart = buildManilaDate(date, time_start);
        const appointment_timeend = buildManilaDate(date, time_end);

        if (!(appointment_timestart < appointment_timeend)) {
            return NextResponse.json({ message: "Invalid time range" }, { status: 400 });
        }

        const earliestAllowed = addManilaDays(manilaNow(), 3);
        if (appointment_timestart < earliestAllowed) {
            return NextResponse.json(
                { message: "Rescheduled appointments must be at least 3 days in advance" },
                { status: 400 }
            );
        }

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
                { message: "Selected time is outside the doctor's availability" },
                { status: 400 }
            );
        }

        const doctorConflicts = await prisma.appointment.findMany({
            where: {
                doctor_user_id: appointment.doctor_user_id,
                appointment_timestart: { gte: dayStart, lte: dayEnd },
                status: { in: [AppointmentStatus.Pending, AppointmentStatus.Approved] },
                appointment_id: { not: appointment.appointment_id },
            },
        });

        const doctorOverlap = doctorConflicts.some((e) =>
            rangesOverlap(
                appointment_timestart,
                appointment_timeend,
                e.appointment_timestart,
                e.appointment_timeend
            )
        );

        if (doctorOverlap) {
            return NextResponse.json(
                { message: "Another appointment already occupies this time" },
                { status: 409 }
            );
        }

        const patientConflicts = await prisma.appointment.findMany({
            where: {
                patient_user_id: session.user.id,
                appointment_timestart: { gte: dayStart, lte: dayEnd },
                status: {
                    in: [AppointmentStatus.Pending, AppointmentStatus.Approved, AppointmentStatus.Moved],
                },
                appointment_id: { not: appointment.appointment_id },
            },
        });

        const patientOverlap = patientConflicts.some((e) =>
            rangesOverlap(
                appointment_timestart,
                appointment_timeend,
                e.appointment_timestart,
                e.appointment_timeend
            )
        );

        if (patientOverlap) {
            return NextResponse.json(
                { message: "You already booked another appointment for this time" },
                { status: 409 }
            );
        }

        const updated = await prisma.appointment.update({
            where: { appointment_id: id },
            data: {
                appointment_date,
                appointment_timestart,
                appointment_timeend,
                status: AppointmentStatus.Moved,
            },
        });

        return NextResponse.json({ status: updated.status });
    } catch (error) {
        console.error("[PATCH /api/patient/appointments/:id]", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
