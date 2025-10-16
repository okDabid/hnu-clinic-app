import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    rangesOverlap,
    buildManilaDate,
    startOfManilaDay,
    endOfManilaDay,
    manilaNow,
    addManilaDays,
} from "@/lib/time";
import { AppointmentStatus, Role, ServiceType } from "@prisma/client";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const patientId = session.user.id;

        const appointments = await prisma.appointment.findMany({
            where: { patient_user_id: patientId },
            include: {
                doctor: {
                    select: {
                        username: true,
                        specialization: true,
                        employee: { select: { fname: true, lname: true } },
                        student: { select: { fname: true, lname: true } },
                    },
                },
                clinic: { select: { clinic_name: true } },
            },
            orderBy: { appointment_timestart: "asc" },
        });

        const formatted = appointments.map((a) => {
            const doctorName =
                a.doctor?.employee?.fname && a.doctor?.employee?.lname
                    ? `${a.doctor.employee.fname} ${a.doctor.employee.lname}`
                    : a.doctor?.student?.fname && a.doctor?.student?.lname
                        ? `${a.doctor.student.fname} ${a.doctor.student.lname}`
                        : a.doctor?.username ?? "-";

            const manilaDate = new Date(a.appointment_timestart).toLocaleDateString("en-CA", {
                timeZone: "Asia/Manila",
            });

            const start24 = new Date(a.appointment_timestart).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Manila",
            });

            const end24 = new Date(a.appointment_timeend).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Manila",
            });

            return {
                id: a.appointment_id,
                clinicId: a.clinic_id,
                clinic: a.clinic?.clinic_name ?? "-",
                doctor: doctorName,
                doctorId: a.doctor_user_id,
                doctorSpecialization: a.doctor?.specialization ?? null,
                dateISO: manilaDate,
                date: new Date(a.appointment_timestart).toLocaleDateString("en-CA", {
                    timeZone: "Asia/Manila",
                }),
                time: new Date(a.appointment_timestart).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Manila",
                }),
                timeStart: start24,
                timeEnd: end24,
                status: a.status,
            };
        });

        return NextResponse.json(formatted);
    } catch (err) {
        console.error("[GET /api/patient/appointments]", err);
        return NextResponse.json(
            { error: "Failed to fetch appointments" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const patient_user_id = session.user.id as string;
        const body = await req.json();
        const { clinic_id, doctor_user_id, service_type, date, time_start, time_end } =
            body || {};

        if (!clinic_id || !doctor_user_id || !service_type || !date || !time_start || !time_end)
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
            return NextResponse.json({ message: "Invalid date format" }, { status: 400 });

        if (!/^\d{2}:\d{2}$/.test(time_start) || !/^\d{2}:\d{2}$/.test(time_end))
            return NextResponse.json({ message: "Invalid time format" }, { status: 400 });

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) return NextResponse.json({ message: "Clinic not found" }, { status: 404 });

        const doctor = await prisma.users.findUnique({ where: { user_id: doctor_user_id } });
        if (!doctor || doctor.role !== Role.DOCTOR)
            return NextResponse.json({ message: "Doctor not found" }, { status: 404 });

        // ✅ Build PH-local timestamps
        const appointment_date = startOfManilaDay(date);
        const appointment_timestart = buildManilaDate(date, time_start);
        const appointment_timeend = buildManilaDate(date, time_end);
        const dayStart = startOfManilaDay(date);
        const dayEnd = endOfManilaDay(date);

        if (!(appointment_timestart < appointment_timeend))
            return NextResponse.json({ message: "Invalid time range" }, { status: 400 });

        const minStart = addManilaDays(manilaNow(), 3);
        if (appointment_timestart < minStart)
            return NextResponse.json(
                { message: "Appointments must be booked at least 3 days in advance" },
                { status: 400 }
            );

        // ✅ Check if within availability
        const availabilities = await prisma.doctorAvailability.findMany({
            where: {
                doctor_user_id,
                clinic_id,
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
                { message: "Selected time is outside doctor's availability" },
                { status: 400 }
            );

        // ✅ Check overlapping appointments
        const existing = await prisma.appointment.findMany({
            where: {
                doctor_user_id,
                appointment_timestart: { gte: dayStart, lte: dayEnd },
                status: { in: [AppointmentStatus.Pending, AppointmentStatus.Approved] },
            },
        });

        const conflict = existing.some((e) =>
            rangesOverlap(
                appointment_timestart,
                appointment_timeend,
                e.appointment_timestart,
                e.appointment_timeend
            )
        );

        if (conflict)
            return NextResponse.json({ message: "Time slot already booked" }, { status: 409 });

        const patientConflicts = await prisma.appointment.findMany({
            where: {
                patient_user_id,
                appointment_timestart: { gte: dayStart, lte: dayEnd },
                status: { in: [AppointmentStatus.Pending, AppointmentStatus.Approved] },
            },
        });

        const patientOverlap = patientConflicts.some((appt) =>
            rangesOverlap(
                appointment_timestart,
                appointment_timeend,
                appt.appointment_timestart,
                appt.appointment_timeend
            )
        );

        if (patientOverlap)
            return NextResponse.json(
                { message: "You already have an appointment scheduled for this time" },
                { status: 409 }
            );

        // ✅ Create the appointment
        const created = await prisma.appointment.create({
            data: {
                patient_user_id,
                clinic_id,
                doctor_user_id,
                appointment_date,
                appointment_timestart,
                appointment_timeend,
                service_type: service_type as ServiceType,
                status: AppointmentStatus.Pending,
            },
        });

        return NextResponse.json({
            appointment_id: created.appointment_id,
            status: created.status,
        });
    } catch (error) {
        console.error("[POST /api/patient/appointments]", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const patient_user_id = session.user.id as string;
        const body = await req.json();
        const { appointment_id, date, time_start, time_end } = body || {};

        if (!appointment_id || !date || !time_start || !time_end)
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });

        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id },
        });

        if (!appointment || appointment.patient_user_id !== patient_user_id)
            return NextResponse.json({ message: "Appointment not found" }, { status: 404 });

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time_start) || !/^\d{2}:\d{2}$/.test(time_end))
            return NextResponse.json({ message: "Invalid date or time format" }, { status: 400 });

        const appointment_timestart = buildManilaDate(date, time_start);
        const appointment_timeend = buildManilaDate(date, time_end);

        if (!(appointment_timestart < appointment_timeend))
            return NextResponse.json({ message: "Invalid time range" }, { status: 400 });

        const minStart = addManilaDays(manilaNow(), 3);
        if (appointment_timestart < minStart)
            return NextResponse.json(
                { message: "Rescheduled appointments must be at least 3 days ahead" },
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
                { message: "Selected time is outside doctor's availability" },
                { status: 400 }
            );

        const doctorConflicts = await prisma.appointment.findMany({
            where: {
                doctor_user_id: appointment.doctor_user_id,
                appointment_timestart: { gte: dayStart, lte: dayEnd },
                status: { in: [AppointmentStatus.Pending, AppointmentStatus.Approved] },
                NOT: { appointment_id },
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

        if (doctorOverlap)
            return NextResponse.json({ message: "Time slot already booked" }, { status: 409 });

        const patientConflicts = await prisma.appointment.findMany({
            where: {
                patient_user_id,
                appointment_timestart: { gte: dayStart, lte: dayEnd },
                status: { in: [AppointmentStatus.Pending, AppointmentStatus.Approved] },
                NOT: { appointment_id },
            },
        });

        const patientOverlap = patientConflicts.some((appt) =>
            rangesOverlap(
                appointment_timestart,
                appointment_timeend,
                appt.appointment_timestart,
                appt.appointment_timeend
            )
        );

        if (patientOverlap)
            return NextResponse.json(
                { message: "You already have an appointment scheduled for this time" },
                { status: 409 }
            );

        const updated = await prisma.appointment.update({
            where: { appointment_id },
            data: {
                appointment_date: startOfManilaDay(date),
                appointment_timestart,
                appointment_timeend,
                status: AppointmentStatus.Moved,
            },
            select: {
                appointment_id: true,
                appointment_timestart: true,
                appointment_timeend: true,
                status: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[PUT /api/patient/appointments]", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const patient_user_id = session.user.id as string;
        const { appointment_id } = await req.json();

        if (!appointment_id)
            return NextResponse.json({ message: "Missing appointment ID" }, { status: 400 });

        const appointment = await prisma.appointment.findUnique({ where: { appointment_id } });

        if (!appointment || appointment.patient_user_id !== patient_user_id)
            return NextResponse.json({ message: "Appointment not found" }, { status: 404 });

        const cancelled = await prisma.appointment.update({
            where: { appointment_id },
            data: { status: AppointmentStatus.Cancelled },
            select: { appointment_id: true, status: true },
        });

        return NextResponse.json(cancelled);
    } catch (error) {
        console.error("[DELETE /api/patient/appointments]", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
