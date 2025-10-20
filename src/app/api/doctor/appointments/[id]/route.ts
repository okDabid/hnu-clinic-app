import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

const EMAIL_BACKGROUND_COLOR = "#f0fdf4";
const EMAIL_BORDER_COLOR = "#bbf7d0";
const EMAIL_TEXT_COLOR = "#065f46";
const EMAIL_ACCENT_COLOR = "#047857";

function escapeHtml(input: string) {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatPatientName(patient: {
    username: string;
    student: { fname: string | null; lname: string | null } | null;
    employee: { fname: string | null; lname: string | null } | null;
}) {
    if (patient.student?.fname && patient.student?.lname)
        return `${patient.student.fname} ${patient.student.lname}`;
    if (patient.employee?.fname && patient.employee?.lname)
        return `${patient.employee.fname} ${patient.employee.lname}`;
    return patient.username;
}

function getPatientEmail(patient: {
    username: string;
    student: { email: string | null } | null;
    employee: { email: string | null } | null;
}) {
    return (
        patient.student?.email ||
        patient.employee?.email ||
        (patient.username.includes("@") ? patient.username : "")
    );
}

function formatDoctorName(doctor: {
    username: string;
    employee: { fname: string | null; lname: string | null } | null;
}) {
    if (doctor.employee?.fname && doctor.employee?.lname)
        return `Dr. ${doctor.employee.fname} ${doctor.employee.lname}`;
    return doctor.username.startsWith("Dr.")
        ? doctor.username
        : `Dr. ${doctor.username}`;
}

function buildStatusEmail({
    status,
    patientName,
    clinicName,
    schedule,
    doctorName,
    cancelReason,
}: {
    status: AppointmentStatus;
    patientName: string;
    clinicName: string;
    schedule: string;
    doctorName: string;
    cancelReason?: string | null;
}): { subject: string; html: string } | null {
    const safeName = escapeHtml(patientName);
    const safeClinic = escapeHtml(clinicName);
    const safeSchedule = escapeHtml(schedule);
    const safeDoctor = escapeHtml(doctorName);
    const safeReason = cancelReason ? escapeHtml(cancelReason) : null;

    const rows = [
        { label: "Clinic", value: safeClinic },
        { label: "Doctor", value: safeDoctor },
        { label: "Schedule", value: safeSchedule },
    ];

    let heading = "";
    let intro = "";
    let outro = `Thank you,<br/>${safeDoctor}<br/>HNU Clinic`;
    let subject = "";

    switch (status) {
        case AppointmentStatus.Approved:
            heading = "Appointment Approved";
            intro = `<span style="color: ${EMAIL_ACCENT_COLOR}; font-weight: 600;">Good news, <strong style="color: inherit;">${safeName}</strong>! <strong style="color: inherit;">${safeDoctor}</strong> has approved your appointment.</span>`;
            subject = "Your appointment has been approved";
            break;
        case AppointmentStatus.Cancelled:
            heading = "Appointment Cancelled";
            intro = `<span style="color: ${EMAIL_ACCENT_COLOR}; font-weight: 600;">Hello <strong style="color: inherit;">${safeName}</strong>, <strong style="color: inherit;">${safeDoctor}</strong> has cancelled your appointment.</span>`;
            subject = "Your appointment has been cancelled";
            if (safeReason) rows.push({ label: "Cancellation Reason", value: safeReason });
            outro = `If you still need assistance, please book another schedule through the patient portal.<br/><br/>Thank you,<br/>${safeDoctor}<br/>HNU Clinic`;
            break;
        case AppointmentStatus.Completed:
            heading = "Appointment Completed";
            intro = `<span style="color: ${EMAIL_ACCENT_COLOR}; font-weight: 600;">Hello <strong style="color: inherit;">${safeName}</strong>, <strong style="color: inherit;">${safeDoctor}</strong> has marked your appointment as completed.</span>`;
            subject = "Your appointment has been completed";
            outro = `We hope you had a good visit. You can review your consultation notes and next steps inside the patient portal.<br/><br/>Thank you,<br/>${safeDoctor}<br/>HNU Clinic`;
            break;
        default:
            return null;
    }

    const rowHtml = rows
        .map(
            (row) => `
        <tr>
          <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR}; font-weight: 600;">${row.label}</td>
          <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR};">${row.value}</td>
        </tr>`
        )
        .join("");

    const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${EMAIL_BACKGROUND_COLOR}; padding: 24px; border-radius: 16px; border: 1px solid ${EMAIL_BORDER_COLOR}; color: ${EMAIL_TEXT_COLOR};">
      <h2 style="margin-top: 0; color: ${EMAIL_ACCENT_COLOR};">${heading}</h2>
      <p>${intro}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tbody>${rowHtml}</tbody>
      </table>
      <p style="margin-bottom: 0;">${outro}</p>
    </div>`;

    return { subject, html };
}

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
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
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
                        student: { select: { fname: true, lname: true, email: true } },
                        employee: { select: { fname: true, lname: true, email: true } },
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

            const availabilities = await prisma.doctorAvailability.findMany({
                where: {
                    doctor_user_id: appointment.doctor_user_id,
                    clinic_id: appointment.clinic_id,
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
                            student: { select: { fname: true, lname: true, email: true } },
                            employee: { select: { fname: true, lname: true, email: true } },
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
                const oldSchedule = formatManilaDateTime(appointment.appointment_timestart);
                const newSchedule = formatManilaDateTime(updated.appointment_timestart);
                const html = `
                    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${EMAIL_BACKGROUND_COLOR}; padding: 24px; border-radius: 16px; border: 1px solid ${EMAIL_BORDER_COLOR}; color: ${EMAIL_TEXT_COLOR};">
                        <h2 style="margin-top: 0; color: ${EMAIL_ACCENT_COLOR};">Appointment Update</h2>
                        <p style="color: ${EMAIL_ACCENT_COLOR}; font-weight: 600;">Hello <strong style="color: inherit;">${escapeHtml(patientName)}</strong>, <strong style="color: inherit;">${escapeHtml(doctorName)}</strong> has updated your appointment.</p>
                        <p>Your visit at <strong>${escapeHtml(updated.clinic.clinic_name)}</strong> has been moved.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR}; font-weight: 600;">Doctor</td>
                                    <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR};">${escapeHtml(doctorName)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR}; font-weight: 600;">Previous Schedule</td>
                                    <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR};">${escapeHtml(oldSchedule)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR}; font-weight: 600;">New Schedule</td>
                                    <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR};">${escapeHtml(newSchedule)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR}; font-weight: 600;">Doctor's Note</td>
                                    <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR};">${escapeHtml(trimmedReason)}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p>Please log in to your patient portal if you need to reschedule again or have any questions.</p>
                        <p style="margin-bottom: 0;">Thank you,<br/>${escapeHtml(doctorName)}<br/>HNU Clinic</p>
                    </div>
                `;

                try {
                    await sendEmail({
                        to: patientEmail,
                        subject: "Your appointment has been moved",
                        html,
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
                        });
                    } catch (emailErr) {
                        console.error(
                            "[PATCH /api/doctor/appointments/:id] cancellation email error",
                            emailErr
                        );
                    }
                }
            }

            await prisma.appointment.delete({
                where: { appointment_id: id },
            });

            return NextResponse.json({ message: "Appointment cancelled" });
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
                        student: { select: { fname: true, lname: true, email: true } },
                        employee: { select: { fname: true, lname: true, email: true } },
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
