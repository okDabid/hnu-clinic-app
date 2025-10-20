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
    return {
        id: appointment.appointment_id,
        status: appointment.status,
        clinic: appointment.clinic.clinic_name,
        patient: formatPatientName(appointment.patient),
        time: formatManilaDateTime(appointment.appointment_timestart),
        consultation: appointment.consultation?.consultation_id ?? null,
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

        // ... (rest of logic: move, cancel, complete, etc.)
    } catch (error) {
        console.error("[PATCH /api/doctor/appointments/:id]", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
