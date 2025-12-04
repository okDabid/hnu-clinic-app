import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    buildManilaDate,
    startOfManilaDay,
    endOfManilaDay,
    manilaNow,
    formatManilaISODate,
} from "@/lib/time";
import { AppointmentStatus, Prisma, Role, ServiceType } from "@prisma/client";
import { archiveExpiredDutyHours } from "@/lib/duty-hours";
import {
    computeDoctorEarliestBookingStart,
    DEFAULT_MIN_BOOKING_LEAD_DAYS,
} from "@/lib/booking";
import {
    consumeRateLimit,
    ipKey,
    type RateLimitResult,
    withRateLimit,
} from "@/lib/rate-limit";

class AppointmentConflictError extends Error {
    constructor(message = "Time slot already booked") {
        super(message);
        this.name = "AppointmentConflictError";
    }
}

const ACTIVE_APPOINTMENT_STATUSES = [
    AppointmentStatus.Pending,
    AppointmentStatus.Approved,
    AppointmentStatus.Moved,
];

function isPrismaOverlapError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034" || error.code === "P2036")
    );
}

function rateLimitResponse(message: string, result: RateLimitResult) {
    const response = NextResponse.json({ message }, { status: 429 });
    if (result.retryAfterMs) {
        response.headers.set("Retry-After", Math.ceil(result.retryAfterMs / 1000).toString());
    }
    return response;
}

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
                clinicId: a.clinic_id,
                doctor: doctorName,
                doctorId: a.doctor_user_id,
                date: new Date(a.appointment_timestart).toLocaleDateString("en-CA", {
                    timeZone: "Asia/Manila",
                }),
                time: new Date(a.appointment_timestart).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Manila",
                }),
                startISO: a.appointment_timestart.toISOString(),
                endISO: a.appointment_timeend.toISOString(),
                serviceType: a.service_type,
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

async function postHandler(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const patient_user_id = session.user.id as string;

        const burstLimit = await consumeRateLimit(
            `patient:appointments:create:burst:${patient_user_id}`,
            5,
            60_000
        );
        if (!burstLimit.success)
            return rateLimitResponse(
                "You're making appointment requests too quickly. Please wait a moment and try again.",
                burstLimit
            );

        const dailyLimit = await consumeRateLimit(
            `patient:appointments:create:day:${patient_user_id}`,
            12,
            24 * 60 * 60_000
        );
        if (!dailyLimit.success)
            return rateLimitResponse(
                "You've reached the daily limit for creating appointments. Please try again tomorrow or contact the clinic for assistance.",
                dailyLimit
            );

        const body = await req.json();
        const { clinic_id, doctor_user_id, service_type, date, time_start, time_end } =
            body || {};

        if (!clinic_id || !doctor_user_id || !service_type || !date || !time_start || !time_end)
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) return NextResponse.json({ message: "Clinic not found" }, { status: 404 });

        const doctor = await prisma.users.findUnique({
            where: { user_id: doctor_user_id },
            select: { role: true, employee: { select: { specialization: true } } },
        });
        if (!doctor || doctor.role !== Role.DOCTOR)
            return NextResponse.json({ message: "Doctor not found" }, { status: 404 });

        // Build PH-local timestamps
        const appointment_date = startOfManilaDay(date);
        const appointment_timestart = buildManilaDate(date, time_start);
        const appointment_timeend = buildManilaDate(date, time_end);
        const dayStart = startOfManilaDay(date);
        const dayEnd = endOfManilaDay(date);
        const now = manilaNow();
        const earliestBookingStart = computeDoctorEarliestBookingStart(
            now,
            doctor.employee?.specialization,
            DEFAULT_MIN_BOOKING_LEAD_DAYS,
        );

        if (!(appointment_timestart < appointment_timeend))
            return NextResponse.json({ message: "Invalid time range" }, { status: 400 });

        if (appointment_timestart < earliestBookingStart) {
            const earliestDate = formatManilaISODate(earliestBookingStart);
            return NextResponse.json(
                { message: `Appointments must be scheduled on or after ${earliestDate}` },
                { status: 400 }
            );
        }

        // Check if within availability
        await archiveExpiredDutyHours({ doctor_user_id });

        const availabilities = await prisma.doctorAvailability.findMany({
            where: {
                doctor_user_id,
                clinic_id,
                archivedAt: null,
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

        let created: Awaited<ReturnType<typeof prisma.appointment.create>>;
        try {
            created = await prisma.$transaction(
                async (tx) => {
                    const conflict = await tx.appointment.findFirst({
                        where: {
                            doctor_user_id,
                            status: { in: ACTIVE_APPOINTMENT_STATUSES },
                            appointment_timestart: { lt: appointment_timeend },
                            appointment_timeend: { gt: appointment_timestart },
                        },
                        select: { appointment_id: true },
                    });

                    if (conflict) {
                        throw new AppointmentConflictError();
                    }

                    return tx.appointment.create({
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
                },
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
            );
        } catch (error) {
            if (error instanceof AppointmentConflictError || isPrismaOverlapError(error)) {
                return NextResponse.json({ message: "Time slot already booked" }, { status: 409 });
            }

            throw error;
        }

        return NextResponse.json({
            appointment_id: created.appointment_id,
            status: created.status,
        });
    } catch (error) {
        console.error("[POST /api/patient/appointments]", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export const POST = withRateLimit(
    {
        key: ipKey("patient:appointments:create:ip"),
        limit: 12,
        windowMs: 60_000,
        message: "Too many appointment requests from this IP. Please slow down before trying again.",
    },
    postHandler
);

async function patchHandler(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const patient_user_id = session.user.id as string;

        const burstLimit = await consumeRateLimit(
            `patient:appointments:reschedule:burst:${patient_user_id}`,
            5,
            60_000
        );
        if (!burstLimit.success)
            return rateLimitResponse(
                "You're updating appointments too quickly. Please wait a moment before trying again.",
                burstLimit
            );

        const dailyLimit = await consumeRateLimit(
            `patient:appointments:reschedule:day:${patient_user_id}`,
            12,
            24 * 60 * 60_000
        );
        if (!dailyLimit.success)
            return rateLimitResponse(
                "You've reached the daily limit for appointment changes. Please try again tomorrow or contact the clinic for assistance.",
                dailyLimit
            );

        const body = await req.json();
        const { appointment_id, date, time_start, time_end } = body || {};

        if (!appointment_id || !date || !time_start || !time_end) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id },
        });

        if (!appointment || appointment.patient_user_id !== patient_user_id) {
            return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
        }

        const doctor = await prisma.users.findUnique({
            where: { user_id: appointment.doctor_user_id },
            select: { employee: { select: { specialization: true } } },
        });

        if (!doctor) {
            return NextResponse.json({ message: "Doctor not found" }, { status: 404 });
        }

        if (
            appointment.status === AppointmentStatus.Completed ||
            appointment.status === AppointmentStatus.Cancelled
        ) {
            return NextResponse.json(
                { message: "Completed or cancelled appointments cannot be rescheduled" },
                { status: 400 }
            );
        }

        const now = manilaNow();
        if (appointment.appointment_timestart <= now) {
            return NextResponse.json(
                { message: "Past appointments cannot be rescheduled" },
                { status: 400 }
            );
        }

        const appointment_date = startOfManilaDay(date);
        const appointment_timestart = buildManilaDate(date, time_start);
        const appointment_timeend = buildManilaDate(date, time_end);
        const earliestBookingStart = computeDoctorEarliestBookingStart(
            now,
            doctor.employee?.specialization,
            DEFAULT_MIN_BOOKING_LEAD_DAYS,
        );

        if (!(appointment_timestart < appointment_timeend)) {
            return NextResponse.json({ message: "Invalid time range" }, { status: 400 });
        }

        if (appointment_timestart < earliestBookingStart) {
            const earliestDate = formatManilaISODate(earliestBookingStart);
            return NextResponse.json(
                { message: `Appointments must be scheduled on or after ${earliestDate}` },
                { status: 400 }
            );
        }

        const dayStart = startOfManilaDay(date);
        const dayEnd = endOfManilaDay(date);

        await archiveExpiredDutyHours({ doctor_user_id: appointment.doctor_user_id });

        const availabilities = await prisma.doctorAvailability.findMany({
            where: {
                doctor_user_id: appointment.doctor_user_id,
                clinic_id: appointment.clinic_id,
                archivedAt: null,
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

        try {
            await prisma.$transaction(
                async (tx) => {
                    const conflict = await tx.appointment.findFirst({
                        where: {
                            doctor_user_id: appointment.doctor_user_id,
                            appointment_id: { not: appointment_id },
                            status: { in: ACTIVE_APPOINTMENT_STATUSES },
                            appointment_timestart: { lt: appointment_timeend },
                            appointment_timeend: { gt: appointment_timestart },
                        },
                        select: { appointment_id: true },
                    });

                    if (conflict) {
                        throw new AppointmentConflictError();
                    }

                    await tx.appointment.update({
                        where: { appointment_id },
                        data: {
                            appointment_date,
                            appointment_timestart,
                            appointment_timeend,
                            status: AppointmentStatus.Pending,
                            remarks: null,
                        },
                    });
                },
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
            );
        } catch (error) {
            if (error instanceof AppointmentConflictError || isPrismaOverlapError(error)) {
                return NextResponse.json({ message: "Time slot already booked" }, { status: 409 });
            }

            throw error;
        }

        return NextResponse.json({ message: "Reschedule request submitted" });
    } catch (error) {
        console.error("[PATCH /api/patient/appointments]", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export const PATCH = withRateLimit(
    {
        key: ipKey("patient:appointments:reschedule:ip"),
        limit: 12,
        windowMs: 60_000,
        message: "Too many appointment updates from this IP. Please slow down before trying again.",
    },
    patchHandler
);

async function deleteHandler(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const patient_user_id = session.user.id as string;

        const burstLimit = await consumeRateLimit(
            `patient:appointments:cancel:burst:${patient_user_id}`,
            5,
            60_000
        );
        if (!burstLimit.success)
            return rateLimitResponse(
                "You're cancelling appointments too quickly. Please wait a moment before trying again.",
                burstLimit
            );

        const dailyLimit = await consumeRateLimit(
            `patient:appointments:cancel:day:${patient_user_id}`,
            12,
            24 * 60 * 60_000
        );
        if (!dailyLimit.success)
            return rateLimitResponse(
                "You've reached the daily limit for cancelling appointments. Please contact the clinic if you need additional assistance.",
                dailyLimit
            );

        const body = await req.json();
        const { appointment_id } = body || {};

        if (!appointment_id) {
            return NextResponse.json({ message: "Missing appointment id" }, { status: 400 });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id },
        });

        if (!appointment || appointment.patient_user_id !== patient_user_id) {
            return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
        }

        const now = manilaNow();

        if (appointment.appointment_timestart <= now) {
            return NextResponse.json(
                { message: "Past appointments cannot be cancelled" },
                { status: 400 }
            );
        }

        if (appointment.status === AppointmentStatus.Completed) {
            return NextResponse.json(
                { message: "Completed appointments cannot be cancelled" },
                { status: 400 }
            );
        }

        if (appointment.status === AppointmentStatus.Cancelled) {
            return NextResponse.json({ message: "Appointment already cancelled" });
        }

        await prisma.$transaction(async (tx) => {
            // Clear any previously cancelled appointments in the same slot to avoid
            // uniqueness conflicts when cancelling and rebooking the same time.
            await tx.appointment.deleteMany({
                where: {
                    appointment_id: { not: appointment_id },
                    doctor_user_id: appointment.doctor_user_id,
                    appointment_timestart: appointment.appointment_timestart,
                    appointment_timeend: appointment.appointment_timeend,
                    status: AppointmentStatus.Cancelled,
                },
            });

            await tx.appointment.update({
                where: { appointment_id },
                data: { status: AppointmentStatus.Cancelled },
            });
        });

        return NextResponse.json({ message: "Appointment cancelled" });
    } catch (error) {
        console.error("[DELETE /api/patient/appointments]", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export const DELETE = withRateLimit(
    {
        key: ipKey("patient:appointments:cancel:ip"),
        limit: 12,
        windowMs: 60_000,
        message: "Too many appointment cancellations from this IP. Please slow down before trying again.",
    },
    deleteHandler
);
