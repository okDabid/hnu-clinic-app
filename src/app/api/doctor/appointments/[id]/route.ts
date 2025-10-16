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
    if (patient.student?.fname && patient.student?.lname) {
        return `${patient.student.fname} ${patient.student.lname}`;
    }
    if (patient.employee?.fname && patient.employee?.lname) {
        return `${patient.employee.fname} ${patient.employee.lname}`;
    }
    return patient.username;
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
}) {
    const patientName = formatPatientName(appointment.patient);
    const time = new Date(appointment.appointment_timestart).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
    });

    return {
        id: appointment.appointment_id,
        patientName,
        clinic: appointment.clinic.clinic_name,
        date: formatManilaISODate(appointment.appointment_timestart),
        time,
        status: appointment.status,
    };
}

// ✅ Use Promise in context parameter (Next.js 14+ correct typing)
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // ✅ Await the promise for params
        const { id } = await context.params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const action = typeof body.action === "string" ? body.action : null;

        if (!action) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

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
            },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }

        if (appointment.doctor_user_id !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

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
                    { error: "Selected time is outside doctor's availability" },
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
                },
            });

            const patientName = formatPatientName(updated.patient);
            const patientEmail =
                appointment.patient.student?.email ||
                appointment.patient.employee?.email ||
                (appointment.patient.username.includes("@")
                    ? appointment.patient.username
                    : "");

            if (patientEmail) {
                const oldSchedule = formatManilaDateTime(appointment.appointment_timestart);
                const newSchedule = formatManilaDateTime(updated.appointment_timestart);
                const html = `
                    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0fdf4; padding: 24px; border-radius: 16px; border: 1px solid #bbf7d0; color: #065f46;">
                        <h2 style="margin-top: 0; color: #047857;">Appointment Update</h2>
                        <p>Hello <strong>${escapeHtml(patientName)}</strong>,</p>
                        <p>Your appointment at <strong>${escapeHtml(updated.clinic.clinic_name)}</strong> has been moved by your doctor.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #bbf7d0; font-weight: 600;">Previous Schedule</td>
                                    <td style="padding: 8px; border: 1px solid #bbf7d0;">${escapeHtml(oldSchedule)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #bbf7d0; font-weight: 600;">New Schedule</td>
                                    <td style="padding: 8px; border: 1px solid #bbf7d0;">${escapeHtml(newSchedule)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #bbf7d0; font-weight: 600;">Doctor's Note</td>
                                    <td style="padding: 8px; border: 1px solid #bbf7d0;">${escapeHtml(trimmedReason)}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p>Please log in to your patient portal if you need to reschedule again or have any questions.</p>
                        <p style="margin-bottom: 0;">Thank you,<br/>HNU Clinic</p>
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

        // ✅ Map frontend actions to Prisma enum
        let newStatus: AppointmentStatus;
        switch (action) {
            case "approve":
                newStatus = AppointmentStatus.Approved;
                break;
            case "cancel":
                newStatus = AppointmentStatus.Cancelled;
                break;
            case "complete":
                newStatus = AppointmentStatus.Completed;
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        // ✅ Update appointment and include relations
        const updated = await prisma.appointment.update({
            where: { appointment_id: id },
            data: { status: newStatus },
            include: {
                patient: {
                    select: {
                        username: true,
                        student: { select: { fname: true, lname: true } },
                        employee: { select: { fname: true, lname: true } },
                    },
                },
                clinic: { select: { clinic_name: true } },
            },
        });

        return NextResponse.json(shapeResponse(updated));
    } catch (error) {
        console.error("[PATCH /api/doctor/appointments/:id]", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
