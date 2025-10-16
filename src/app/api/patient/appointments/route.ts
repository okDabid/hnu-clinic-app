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
    toManilaDateString,
    toManilaTimeString,
} from "@/lib/time";
import { AppointmentStatus, Role, ServiceType } from "@prisma/client";

const MIN_BOOKING_LEAD_MS = 3 * 24 * 60 * 60 * 1000;

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

            return {
                id: a.appointment_id,
                clinic: a.clinic?.clinic_name ?? "-",
                clinic_id: a.clinic_id,
                doctor_user_id: a.doctor_user_id,
                doctor: doctorName,
                date: new Date(a.appointment_timestart).toLocaleDateString("en-CA", {
                    timeZone: "Asia/Manila",
                }),
                time: new Date(a.appointment_timestart).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Manila",
                }),
                date_raw: toManilaDateString(a.appointment_timestart.toISOString()),
                time_start: toManilaTimeString(a.appointment_timestart.toISOString()),
                time_end: toManilaTimeString(a.appointment_timeend.toISOString()),
                status: a.status,
                service_type: a.service_type,
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
        const now = manilaNow();

        if (!(appointment_timestart < appointment_timeend))
            return NextResponse.json({ message: "Invalid time range" }, { status: 400 });

        if (appointment_timestart.getTime() - now.getTime() < MIN_BOOKING_LEAD_MS)
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
                status: {
                    in: [AppointmentStatus.Pending, AppointmentStatus.Approved, AppointmentStatus.Moved],
                },
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

        if (appointment.status === AppointmentStatus.Cancelled)
            return NextResponse.json(
                { message: "Cancelled appointments cannot be rescheduled" },
                { status: 400 }
            );

        const appointment_date = startOfManilaDay(date);
        const appointment_timestart = buildManilaDate(date, time_start);
        const appointment_timeend = buildManilaDate(date, time_end);
        const dayStart = startOfManilaDay(date);
        const dayEnd = endOfManilaDay(date);

        if (!(appointment_timestart < appointment_timeend))
            return NextResponse.json({ message: "Invalid time range" }, { status: 400 });

        const now = manilaNow();
        if (appointment_timestart.getTime() - now.getTime() < MIN_BOOKING_LEAD_MS)
            return NextResponse.json(
                { message: "Appointments must be booked at least 3 days in advance" },
                { status: 400 }
            );

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

        const existing = await prisma.appointment.findMany({
            where: {
                doctor_user_id: appointment.doctor_user_id,
                appointment_timestart: { gte: dayStart, lte: dayEnd },
                status: {
                    in: [AppointmentStatus.Pending, AppointmentStatus.Approved, AppointmentStatus.Moved],
                },
                appointment_id: { not: appointment_id },
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

        const updated = await prisma.appointment.update({
            where: { appointment_id },
            data: {
                appointment_date,
                appointment_timestart,
                appointment_timeend,
                status: AppointmentStatus.Moved,
            },
        });

        return NextResponse.json({
            appointment_id: updated.appointment_id,
            status: updated.status,
        });
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
        const body = await req.json();
        const { appointment_id } = body || {};

        if (!appointment_id)
            return NextResponse.json({ message: "Missing appointment ID" }, { status: 400 });

        const appointment = await prisma.appointment.findUnique({ where: { appointment_id } });

        if (!appointment || appointment.patient_user_id !== patient_user_id)
            return NextResponse.json({ message: "Appointment not found" }, { status: 404 });

        if (appointment.status === AppointmentStatus.Cancelled)
            return NextResponse.json({ message: "Appointment already cancelled" }, { status: 200 });

        await prisma.appointment.update({
            where: { appointment_id },
            data: { status: AppointmentStatus.Cancelled },
        });

        return NextResponse.json({ message: "Appointment cancelled" });
    } catch (error) {
        console.error("[DELETE /api/patient/appointments]", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
