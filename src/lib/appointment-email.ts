import { AppointmentStatus } from "@prisma/client";

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

export interface AppointmentEmailPatient {
    username: string;
    student: { fname: string | null; lname: string | null; email?: string | null } | null;
    employee: { fname: string | null; lname: string | null; email?: string | null } | null;
    passwordResetTokens?: { contact: string }[];
}

export interface AppointmentEmailDoctor {
    username: string;
    employee: { fname: string | null; lname: string | null } | null;
}

export type AppointmentNameSource = Pick<
    AppointmentEmailPatient,
    "username" | "student" | "employee"
>;

export function formatPatientName(patient: AppointmentNameSource) {
    if (patient.student?.fname && patient.student?.lname)
        return `${patient.student.fname} ${patient.student.lname}`;
    if (patient.employee?.fname && patient.employee?.lname)
        return `${patient.employee.fname} ${patient.employee.lname}`;
    return patient.username;
}

export function formatDoctorName(doctor: AppointmentEmailDoctor) {
    if (doctor.employee?.fname && doctor.employee?.lname)
        return `Dr. ${doctor.employee.fname} ${doctor.employee.lname}`;
    return doctor.username.startsWith("Dr.")
        ? doctor.username
        : `Dr. ${doctor.username}`;
}

export function getPatientEmail(patient: AppointmentEmailPatient) {
    const verifiedContacts = new Set(
        (patient.passwordResetTokens ?? []).map((token) => token.contact.toLowerCase()),
    );

    const studentEmail = patient.student?.email?.trim() ?? "";
    if (studentEmail && verifiedContacts.has(studentEmail.toLowerCase())) {
        return studentEmail;
    }

    const employeeEmail = patient.employee?.email?.trim() ?? "";
    if (employeeEmail && verifiedContacts.has(employeeEmail.toLowerCase())) {
        return employeeEmail;
    }

    return patient.username.includes("@") ? patient.username : "";
}

function buildTableRows(rows: { label: string; value: string }[]) {
    return rows
        .map(
            (row) => `
        <tr>
          <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR}; font-weight: 600;">${row.label}</td>
          <td style="padding: 8px; border: 1px solid ${EMAIL_BORDER_COLOR};">${row.value}</td>
        </tr>`
        )
        .join("");
}

export function buildMoveEmail({
    patientName,
    doctorName,
    clinicName,
    oldSchedule,
    newSchedule,
    reason,
}: {
    patientName: string;
    doctorName: string;
    clinicName: string;
    oldSchedule: string | null | undefined;
    newSchedule: string | null | undefined;
    reason: string;
}) {
    const rows = [
        { label: "Doctor", value: escapeHtml(doctorName) },
        { label: "Previous Schedule", value: escapeHtml(oldSchedule ?? "Unavailable") },
        { label: "New Schedule", value: escapeHtml(newSchedule ?? "Unavailable") },
        { label: "Doctor's Note", value: escapeHtml(reason) },
    ];

    const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${EMAIL_BACKGROUND_COLOR}; padding: 24px; border-radius: 16px; border: 1px solid ${EMAIL_BORDER_COLOR}; color: ${EMAIL_TEXT_COLOR};">
      <h2 style="margin-top: 0; color: ${EMAIL_ACCENT_COLOR};">Appointment Update</h2>
      <p style="color: ${EMAIL_ACCENT_COLOR}; font-weight: 600;">Hello <strong style="color: inherit;">${escapeHtml(
        patientName,
    )}</strong>, <strong style="color: inherit;">${escapeHtml(
        doctorName,
    )}</strong> has updated your appointment.</p>
      <p>Your visit at <strong>${escapeHtml(clinicName)}</strong> has been moved.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tbody>${buildTableRows(rows)}</tbody>
      </table>
      <p>Please log in to your patient portal if you need to reschedule again or have any questions.</p>
      <p style="margin-bottom: 0;">Thank you,<br/>${escapeHtml(doctorName)}<br/>HNU Clinic</p>
    </div>`;

    const text = [
        `Hello ${patientName},`,
        "",
        `${doctorName} has updated your appointment at ${clinicName}.`,
        "",
        `Previous Schedule: ${oldSchedule ?? "Unavailable"}`,
        `New Schedule: ${newSchedule ?? "Unavailable"}`,
        `Doctor's Note: ${reason}`,
        "",
        "Please log in to your patient portal if you need to reschedule again or have any questions.",
        "",
        "Thank you,",
        doctorName,
        "HNU Clinic",
    ].join("\n");

    return { subject: "Your appointment has been moved", html, text };
}

export function buildStatusEmail({
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
    schedule: string | null | undefined;
    doctorName: string;
    cancelReason?: string | null;
}): { subject: string; html: string; text: string } | null {
    const safeName = escapeHtml(patientName);
    const safeClinic = escapeHtml(clinicName);
    const safeSchedule = escapeHtml(schedule ?? "Unavailable");
    const safeDoctor = escapeHtml(doctorName);
    const safeReason = cancelReason ? escapeHtml(cancelReason) : null;

    const rows = [
        { label: "Clinic", value: safeClinic },
        { label: "Doctor", value: safeDoctor },
        { label: "Schedule", value: safeSchedule },
    ];

    const textRows: Array<[string, string]> = [
        ["Clinic", clinicName],
        ["Doctor", doctorName],
        ["Schedule", schedule ?? "Unavailable"],
    ];

    let heading = "";
    let intro = "";
    let outro = `Thank you,<br/>${safeDoctor}<br/>HNU Clinic`;
    let subject = "";
    let textIntro = "";
    let textOutro = `Thank you,\n${doctorName}\nHNU Clinic`;

    switch (status) {
        case AppointmentStatus.Approved:
            heading = "Appointment Approved";
            intro = `<span style="color: ${EMAIL_ACCENT_COLOR}; font-weight: 600;">Good news, <strong style="color: inherit;">${safeName}</strong>! <strong style="color: inherit;">${safeDoctor}</strong> has approved your appointment.</span>`;
            subject = "Your appointment has been approved";
            textIntro = `Good news, ${patientName}! ${doctorName} has approved your appointment.`;
            break;
        case AppointmentStatus.Cancelled:
            heading = "Appointment Cancelled";
            intro = `<span style="color: ${EMAIL_ACCENT_COLOR}; font-weight: 600;">Hello <strong style="color: inherit;">${safeName}</strong>, <strong style="color: inherit;">${safeDoctor}</strong> has cancelled your appointment.</span>`;
            subject = "Your appointment has been cancelled";
            if (safeReason) rows.push({ label: "Cancellation Reason", value: safeReason });
            if (cancelReason) textRows.push(["Cancellation Reason", cancelReason]);
            outro = `If you still need assistance, please book another schedule through the patient portal.<br/><br/>Thank you,<br/>${safeDoctor}<br/>HNU Clinic`;
            textIntro = `Hello ${patientName}, ${doctorName} has cancelled your appointment.`;
            textOutro = `If you still need assistance, please book another schedule through the patient portal.\n\nThank you,\n${doctorName}\nHNU Clinic`;
            break;
        case AppointmentStatus.Completed:
            heading = "Appointment Completed";
            intro = `<span style="color: ${EMAIL_ACCENT_COLOR}; font-weight: 600;">Hello <strong style="color: inherit;">${safeName}</strong>, <strong style="color: inherit;">${safeDoctor}</strong> has marked your appointment as completed.</span>`;
            subject = "Your appointment has been completed";
            outro = `We hope you had a good visit. You can review your consultation notes and next steps inside the patient portal.<br/><br/>Thank you,<br/>${safeDoctor}<br/>HNU Clinic`;
            textIntro = `Hello ${patientName}, ${doctorName} has marked your appointment as completed.`;
            textOutro = `We hope you had a good visit. You can review your consultation notes and next steps inside the patient portal.\n\nThank you,\n${doctorName}\nHNU Clinic`;
            break;
        default:
            return null;
    }

    const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${EMAIL_BACKGROUND_COLOR}; padding: 24px; border-radius: 16px; border: 1px solid ${EMAIL_BORDER_COLOR}; color: ${EMAIL_TEXT_COLOR};">
      <h2 style="margin-top: 0; color: ${EMAIL_ACCENT_COLOR};">${heading}</h2>
      <p>${intro}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tbody>${buildTableRows(rows)}</tbody>
      </table>
      <p style="margin-bottom: 0;">${outro}</p>
    </div>`;

    const text = [
        textIntro,
        "",
        ...textRows.map(([label, value]) => `${label}: ${value}`),
        "",
        textOutro,
    ]
        .join("\n")
        .trim();

    return { subject, html, text };
}
