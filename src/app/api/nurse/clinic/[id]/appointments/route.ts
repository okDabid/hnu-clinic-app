import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { handleAuthError, requireRole } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { formatManilaISODate, manilaNow, startOfManilaDay } from "@/lib/time";

const MONTH_PARAM_PATTERN = /^\d{4}-\d{2}$/;

type RouteContext = {
    params: Promise<{ id: string }>;
};

type DoctorNameSource = {
    username: string;
    employee: { fname: string | null; lname: string | null } | null;
};

type PatientNameSource = {
    username: string;
    student: { fname: string | null; lname: string | null } | null;
    employee: { fname: string | null; lname: string | null } | null;
};

function formatPersonName(
    fallback: string,
    profile: { fname: string | null; lname: string | null } | null
) {
    const first = profile?.fname?.trim();
    const last = profile?.lname?.trim();

    if (first && last) {
        return `${first} ${last}`;
    }

    if (last && !first) {
        return last;
    }

    if (first && !last) {
        return first;
    }

    return fallback;
}

function formatDoctorName(doctor: DoctorNameSource) {
    return formatPersonName(doctor.username, doctor.employee);
}

function formatPatientName(patient: PatientNameSource) {
    const studentName = formatPersonName(patient.username, patient.student);
    const employeeName = formatPersonName(patient.username, patient.employee);

    if (patient.student) return studentName;
    if (patient.employee) return employeeName;
    return patient.username;
}

function resolveMonthRange(monthParam: string | null) {
    const fallbackMonth = formatManilaISODate(manilaNow()).slice(0, 7);
    const monthKey = monthParam && MONTH_PARAM_PATTERN.test(monthParam) ? monthParam : fallbackMonth;

    const monthStart = startOfManilaDay(`${monthKey}-01`);

    const [yearStr, monthStr] = monthKey.split("-");
    const parsedYear = Number.parseInt(yearStr, 10);
    const parsedMonth = Number.parseInt(monthStr, 10);

    const baseYear = Number.isNaN(parsedYear) ? new Date().getUTCFullYear() : parsedYear;
    const baseMonth = Number.isNaN(parsedMonth) ? 1 : parsedMonth;

    const nextMonthNumber = baseMonth === 12 ? 1 : baseMonth + 1;
    const nextMonthYear = baseMonth === 12 ? baseYear + 1 : baseYear;
    const nextMonthKey = `${nextMonthYear}-${String(nextMonthNumber).padStart(2, "0")}`;

    const monthEndExclusive = startOfManilaDay(`${nextMonthKey}-01`);

    return { monthKey, monthStart, monthEndExclusive };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
    try {
        await requireRole([Role.NURSE]);

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
        }

        const url = new URL(req.url);
        const { monthKey, monthStart, monthEndExclusive } = resolveMonthRange(url.searchParams.get("month"));

        const appointments = await prisma.appointment.findMany({
            where: {
                clinic_id: id,
                appointment_timestart: { gte: monthStart, lt: monthEndExclusive },
            },
            include: {
                doctor: {
                    select: {
                        user_id: true,
                        username: true,
                        employee: { select: { fname: true, lname: true } },
                    },
                },
                patient: {
                    select: {
                        user_id: true,
                        username: true,
                        student: { select: { fname: true, lname: true } },
                        employee: { select: { fname: true, lname: true } },
                    },
                },
            },
            orderBy: [{ appointment_timestart: "asc" }],
        });

        const payload = appointments.map((appointment) => ({
            id: appointment.appointment_id,
            date: formatManilaISODate(appointment.appointment_timestart),
            startISO: appointment.appointment_timestart.toISOString(),
            endISO: appointment.appointment_timeend.toISOString(),
            status: appointment.status,
            doctor: {
                id: appointment.doctor_user_id,
                name: formatDoctorName({
                    username: appointment.doctor.username,
                    employee: appointment.doctor.employee,
                }),
            },
            patient: {
                id: appointment.patient_user_id,
                name: formatPatientName({
                    username: appointment.patient.username,
                    student: appointment.patient.student,
                    employee: appointment.patient.employee,
                }),
                type: appointment.patient.student
                    ? "Student"
                    : appointment.patient.employee
                        ? "Employee"
                        : "Unknown",
            },
        }));

        return NextResponse.json({
            clinicId: id,
            month: monthKey,
            range: {
                start: monthStart.toISOString(),
                endExclusive: monthEndExclusive.toISOString(),
            },
            appointments: payload,
        });
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("GET /api/nurse/clinic/[id]/appointments error:", err);
        return NextResponse.json({ error: "Failed to fetch clinic appointments" }, { status: 500 });
    }
}
