import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { archiveExpiredDutyHours } from "@/lib/duty-hours";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppointmentStatus } from "@prisma/client";
import {
    buildManilaDate,
    endOfManilaDay,
    formatManilaDateTime,
    formatManilaISODate,
    manilaNow,
    rangesOverlap,
    startOfManilaDay,
} from "@/lib/time";
import { sendEmail } from "@/lib/email";
import { EMAIL_VERIFICATION_TOKEN_TYPE } from "@/lib/email-verification";
import {
    buildMoveEmail,
    buildStatusEmail,
    formatDoctorName,
    formatPatientName,
    getPatientEmail,
} from "@/lib/appointment-email";


function shapeResponse(appointment: {
    appointment_id: string;
    appointment_timestart: Date;
    status: AppointmentStatus;
    clinic: { clinic_name: string };
    patient: {
        username: string;
        student: { fname: string | null; lname: string | null } | null;
        employee: { fname: string | null; lname: string | null } | null;
    };
    consultation: { consultation_id: string } | null;
}) {
    const patientType = appointment.patient.student
        ? "Student"
        : appointment.patient.employee
            ? "Employee"
            : "Unknown";

    const timeOnly =
        formatManilaDateTime(appointment.appointment_timestart, {
            year: undefined,
            month: undefined,
            day: undefined,
        }) ?? "";

    return {
        id: appointment.appointment_id,
        status: appointment.status,
        clinic: appointment.clinic.clinic_name,
        patientName: formatPatientName(appointment.patient),
        date: formatManilaISODate(appointment.appointment_timestart),
        time: timeOnly,
        hasConsultation: Boolean(appointment.consultation),
        patientType,
    };
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = (await request.json()) as Record<string, unknown>;
        const action = typeof body.action === "string" ? body.action : null;
        if (!action)
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });

        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id: id },
            include: {
                consultation: { select: { consultation_id: true } },
                patient: {
                    select: {
                        username: true,
                        student: {
                            select: { fname: true, lname: true, email: true },
                        },
                        employee: {
                            select: { fname: true, lname: true, email: true },
                        },
                        passwordResetTokens: {
                            where: {
                                type: EMAIL_VERIFICATION_TOKEN_TYPE,
                                verified: true,
                            },
                            select: { contact: true },
                        },
                    },
                },
                clinic: { select: { clinic_name: true } },
                doctor: {
                    select: {
                        username: true,
                        employee: { select: { fname: true, lname: true } },
                    },
                },
            },
        });

        if (!appointment)
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

        if (appointment.doctor_user_id !== session.user.id)
            return NextResponse.json({ error: "Access denied" }, { status: 403 });

        if (action === "move") {
            const { reason, newDate, newTimeStart, newTimeEnd } = body;

            if (
                typeof reason !== "string" ||
                typeof newDate !== "string" ||
                typeof newTimeStart !== "string" ||
                typeof newTimeEnd !== "string"
            ) {
                return NextResponse.json({ error: "Missing move details" }, { status: 400 });
            }

            const trimmedReason = reason.trim();
            if (!trimmedReason || !newDate || !newTimeStart || !newTimeEnd) {
                return NextResponse.json({ error: "Incomplete move details" }, { status: 400 });
            }

            const appointmentDate = startOfManilaDay(newDate);
            const appointmentStart = buildManilaDate(newDate, newTimeStart);
            const appointmentEnd = buildManilaDate(newDate, newTimeEnd);

            if (!(appointmentStart < appointmentEnd)) {
                return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
            }

            const now = manilaNow();
            const earliestMoveDay = startOfManilaDay(formatManilaISODate(now));

            if (appointmentDate < earliestMoveDay) {
                return NextResponse.json(
                    { error: "Cannot move to a past date" },
                    { status: 400 }
                );
            }

            if (appointmentStart <= now) {
                return NextResponse.json(
                    { error: "Cannot move to a past schedule" },
                    { status: 400 }
                );
            }

            const dayStart = startOfManilaDay(newDate);
            const dayEnd = endOfManilaDay(newDate);

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
                (availability) =>
                    appointmentStart >= availability.available_timestart &&
                    appointmentEnd <= availability.available_timeend
            );

            if (!withinAvailability) {
                return NextResponse.json(
                    { error: "Selected time is outside doctor's availability." },
                    { status: 400 }
                );
            }

            const overlapping = await prisma.appointment.findMany({
                where: {
                    doctor_user_id: appointment.doctor_user_id,
                    appointment_timestart: { gte: dayStart, lte: dayEnd },
                    status: {
                        in: [
                            AppointmentStatus.Pending,
                            AppointmentStatus.Approved,
                            AppointmentStatus.Moved,
                        ],
                    },
                    appointment_id: { not: appointment.appointment_id },
                },
            });

            const hasConflict = overlapping.some((entry) =>
                rangesOverlap(
                    appointmentStart,
                    appointmentEnd,
                    entry.appointment_timestart,
                    entry.appointment_timeend
                )
            );

            if (hasConflict) {
                return NextResponse.json(
                    { error: "Time slot already booked" },
                    { status: 409 }
                );
            }

            const updated = await prisma.appointment.update({
                where: { appointment_id: id },
                data: {
                    appointment_date: appointmentDate,
                    appointment_timestart: appointmentStart,
                    appointment_timeend: appointmentEnd,
                    status: AppointmentStatus.Moved,
                    remarks: trimmedReason,
                },
                include: {
                    patient: {
                        select: {
                            username: true,
                            student: {
                                select: { fname: true, lname: true, email: true },
                            },
                            employee: {
                                select: { fname: true, lname: true, email: true },
                            },
                            passwordResetTokens: {
                                where: {
                                    type: EMAIL_VERIFICATION_TOKEN_TYPE,
                                    verified: true,
                                },
                                select: { contact: true },
                            },
                        },
                    },
                    clinic: { select: { clinic_name: true } },
                    consultation: { select: { consultation_id: true } },
                    doctor: {
                        select: {
                            username: true,
                            employee: { select: { fname: true, lname: true } },
                        },
                    },
                },
            });

            const patientName = formatPatientName(updated.patient);
            const patientEmail = getPatientEmail(updated.patient);
            const doctorName = formatDoctorName(updated.doctor);

            if (patientEmail) {
                const moveEmail = buildMoveEmail({
                    patientName,
                    doctorName,
                    clinicName: updated.clinic.clinic_name,
                    oldSchedule: formatManilaDateTime(appointment.appointment_timestart),
                    newSchedule: formatManilaDateTime(updated.appointment_timestart),
                    reason: trimmedReason,
                });

                try {
                    await sendEmail({
                        to: patientEmail,
                        subject: moveEmail.subject,
                        html: moveEmail.html,
                        text: moveEmail.text,
                    });
                } catch (emailErr) {
                    console.error("[PATCH /api/doctor/appointments/:id] email error", emailErr);
                }
            }

            return NextResponse.json(shapeResponse(updated));
        }

        if (action === "complete" && !appointment.consultation) {
            return NextResponse.json(
                { error: "Record the consultation before completing the appointment" },
                { status: 400 }
            );
        }

        if (action === "cancel") {
            const reason = typeof body.reason === "string" ? body.reason.trim() : "";
            if (!reason) {
                return NextResponse.json({ error: "Cancellation reason is required" }, { status: 400 });
            }

            if (appointment.status === AppointmentStatus.Completed) {
                return NextResponse.json(
                    { error: "Completed appointments cannot be cancelled" },
                    { status: 400 }
                );
            }

            if (appointment.status === AppointmentStatus.Cancelled) {
                return NextResponse.json(
                    { error: "Appointment already cancelled" },
                    { status: 400 }
                );
            }

            const patientEmail = getPatientEmail(appointment.patient);
            if (patientEmail) {
                const emailPayload = buildStatusEmail({
                    status: AppointmentStatus.Cancelled,
                    patientName: formatPatientName(appointment.patient),
                    clinicName: appointment.clinic.clinic_name,
                    schedule: formatManilaDateTime(appointment.appointment_timestart),
                    doctorName: formatDoctorName(appointment.doctor),
                    cancelReason: reason,
                });

                if (emailPayload) {
                    try {
                        await sendEmail({
                            to: patientEmail,
                            subject: emailPayload.subject,
                            html: emailPayload.html,
                            text: emailPayload.text,
                        });
                    } catch (emailErr) {
                        console.error(
                            "[PATCH /api/doctor/appointments/:id] cancellation email error",
                            emailErr
                        );
                    }
                }
            }

            const updated = await prisma.appointment.update({
                where: { appointment_id: id },
                data: {
                    status: AppointmentStatus.Cancelled,
                    remarks: reason,
                },
                include: {
                    clinic: { select: { clinic_name: true } },
                    consultation: { select: { consultation_id: true } },
                    patient: {
                        select: {
                            username: true,
                            student: { select: { fname: true, lname: true } },
                            employee: { select: { fname: true, lname: true } },
                        },
                    },
                },
            });

            return NextResponse.json(shapeResponse(updated));
        }

        // Map frontend actions to Prisma enum
        let newStatus: AppointmentStatus;
        switch (action) {
            case "approve":
                newStatus = AppointmentStatus.Approved;
                break;
            case "complete":
                newStatus = AppointmentStatus.Completed;
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        // Update appointment and include relations
        const updated = await prisma.appointment.update({
            where: { appointment_id: id },
            data: {
                status: newStatus,
            },
            include: {
                patient: {
                    select: {
                        username: true,
                        student: {
                            select: { fname: true, lname: true, email: true },
                        },
                        employee: {
                            select: { fname: true, lname: true, email: true },
                        },
                        passwordResetTokens: {
                            where: {
                                type: EMAIL_VERIFICATION_TOKEN_TYPE,
                                verified: true,
                            },
                            select: { contact: true },
                        },
                    },
                },
                clinic: { select: { clinic_name: true } },
                consultation: { select: { consultation_id: true } },
                doctor: {
                    select: {
                        username: true,
                        employee: { select: { fname: true, lname: true } },
                    },
                },
            },
        });

        const patientEmail = getPatientEmail(updated.patient);
        if (patientEmail) {
            const emailPayload = buildStatusEmail({
                status: newStatus,
                patientName: formatPatientName(updated.patient),
                clinicName: updated.clinic.clinic_name,
                schedule: formatManilaDateTime(updated.appointment_timestart),
                doctorName: formatDoctorName(updated.doctor),
            });

            if (emailPayload) {
                try {
                    await sendEmail({
                        to: patientEmail,
                        subject: emailPayload.subject,
                        html: emailPayload.html,
                        text: emailPayload.text,
                    });
                } catch (emailErr) {
                    console.error("[PATCH /api/doctor/appointments/:id] status email error", emailErr);
                }
            }
        }

        return NextResponse.json(shapeResponse(updated));
    } catch (error) {
        console.error("[PATCH /api/doctor/appointments/:id]", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
