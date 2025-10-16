import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    buildManilaDate,
    endOfManilaDay,
    isAtLeastNDaysAway,
    rangesOverlap,
    startOfManilaDay,
} from "@/lib/time";
import { AppointmentStatus } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id: params.id },
            include: {
                clinic: { select: { clinic_name: true } },
                doctor: {
                    select: {
                        username: true,
                        employee: { select: { fname: true, lname: true } },
                        student: { select: { fname: true, lname: true } },
                    },
                },
            },
        });

        if (!appointment || appointment.patient_user_id !== session.user.id)
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

        if ([AppointmentStatus.Cancelled, AppointmentStatus.Completed].includes(appointment.status)) {
            return NextResponse.json(
                { error: "This appointment can no longer be rescheduled" },
                { status: 400 }
            );
        }

        const { date, time_start, time_end } = await req.json();

        if (!date || !time_start || !time_end)
            return NextResponse.json({ error: "Missing new schedule details" }, { status: 400 });

        const appointment_date = startOfManilaDay(date);
        const appointment_timestart = buildManilaDate(date, time_start);
        const appointment_timeend = buildManilaDate(date, time_end);

        if (!(appointment_timestart < appointment_timeend))
            return NextResponse.json({ error: "Invalid time range" }, { status: 400 });

        if (!isAtLeastNDaysAway(appointment_timestart, 3))
            return NextResponse.json(
                { error: "Reschedules must be at least 3 days before the appointment" },
                { status: 400 }
            );

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

        if (!withinAvailability)
            return NextResponse.json(
                { error: "Selected time is outside doctor's availability" },
                { status: 400 }
            );

        const doctorConflicts = await prisma.appointment.findMany({
            where: {
                doctor_user_id: appointment.doctor_user_id,
                appointment_id: { not: appointment.appointment_id },
                appointment_timestart: { gte: dayStart, lte: dayEnd },
                status: { in: [AppointmentStatus.Pending, AppointmentStatus.Approved] },
            },
        });

        const doctorConflict = doctorConflicts.some((e) =>
            rangesOverlap(
                appointment_timestart,
                appointment_timeend,
                e.appointment_timestart,
                e.appointment_timeend
            )
        );

        if (doctorConflict)
            return NextResponse.json(
                { error: "Time slot already booked" },
                { status: 409 }
            );

        const patientConflicts = await prisma.appointment.findMany({
            where: {
                patient_user_id: appointment.patient_user_id,
                appointment_id: { not: appointment.appointment_id },
                appointment_timestart: { gte: dayStart, lte: dayEnd },
                status: { in: [AppointmentStatus.Pending, AppointmentStatus.Approved] },
            },
        });

        const patientConflict = patientConflicts.some((e) =>
            rangesOverlap(
                appointment_timestart,
                appointment_timeend,
                e.appointment_timestart,
                e.appointment_timeend
            )
        );

        if (patientConflict)
            return NextResponse.json(
                { error: "You already have an appointment at this time" },
                { status: 409 }
            );

        const updated = await prisma.appointment.update({
            where: { appointment_id: appointment.appointment_id },
            data: {
                appointment_date,
                appointment_timestart,
                appointment_timeend,
                status: AppointmentStatus.Moved,
            },
            include: {
                clinic: { select: { clinic_name: true } },
                doctor: {
                    select: {
                        username: true,
                        employee: { select: { fname: true, lname: true } },
                        student: { select: { fname: true, lname: true } },
                    },
                },
            },
        });

        const doctorName =
            updated.doctor?.employee?.fname && updated.doctor?.employee?.lname
                ? `${updated.doctor.employee.fname} ${updated.doctor.employee.lname}`
                : updated.doctor?.student?.fname && updated.doctor?.student?.lname
                    ? `${updated.doctor.student.fname} ${updated.doctor.student.lname}`
                    : updated.doctor?.username ?? "-";

        return NextResponse.json({
            id: updated.appointment_id,
            clinic: updated.clinic?.clinic_name ?? "-",
            clinic_id: updated.clinic_id,
            doctor: doctorName,
            doctor_user_id: updated.doctor_user_id,
            service_type: updated.service_type ?? null,
            date: updated.appointment_timestart.toLocaleDateString("en-CA", {
                timeZone: "Asia/Manila",
            }),
            time: updated.appointment_timestart.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila",
            }),
            status: updated.status,
        });
    } catch (err) {
        console.error("[PATCH /api/patient/appointments/:id]", err);
        return NextResponse.json({ error: "Failed to reschedule appointment" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id: params.id },
        });

        if (!appointment || appointment.patient_user_id !== session.user.id)
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

        if ([AppointmentStatus.Cancelled, AppointmentStatus.Completed].includes(appointment.status))
            return NextResponse.json(
                { error: "This appointment is already closed" },
                { status: 400 }
            );

        const cancelled = await prisma.appointment.update({
            where: { appointment_id: appointment.appointment_id },
            data: { status: AppointmentStatus.Cancelled },
        });

        return NextResponse.json({
            id: cancelled.appointment_id,
            status: cancelled.status,
        });
    } catch (err) {
        console.error("[DELETE /api/patient/appointments/:id]", err);
        return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
    }
}
