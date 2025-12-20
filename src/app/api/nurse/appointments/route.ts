import { NextRequest, NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";

import { handleAuthError, requireRole } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { endOfManilaDay, formatManilaISODate, startOfManilaDay } from "@/lib/time";

function formatPersonName(user: {
    username: string;
    employee: { fname: string | null; lname: string | null } | null;
    student: { fname: string | null; lname: string | null } | null;
}) {
    const firstName = user.employee?.fname ?? user.student?.fname;
    const lastName = user.employee?.lname ?? user.student?.lname;

    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return user.username;
}

function formatPatientType(patient: {
    student: { student_id: string | null } | null;
    employee: { employee_id: string | null } | null;
}) {
    if (patient.student) return "Student";
    if (patient.employee) return "Employee";
    return "Patient";
}

function parseDateRange(dateParam: string | null) {
    if (!dateParam) return null;
    const parsed = new Date(`${dateParam}T00:00:00+08:00`);
    if (Number.isNaN(parsed.getTime())) return null;

    return {
        start: startOfManilaDay(dateParam),
        end: endOfManilaDay(dateParam),
    };
}

export async function GET(req: NextRequest) {
    try {
        await requireRole([Role.NURSE]);

        const url = new URL(req.url);
        const staffRole = url.searchParams.get("staffRole");
        const dateParam = url.searchParams.get("date");

        const range = parseDateRange(dateParam);

        const where: Prisma.AppointmentWhereInput = {};
        if (range) {
            where.appointment_timestart = { gte: range.start, lte: range.end };
        }

        const appointments = await prisma.appointment.findMany({
            where,
            orderBy: { appointment_timestart: "asc" },
            include: {
                clinic: { select: { clinic_name: true } },
                doctor: {
                    select: {
                        username: true,
                        employee: { select: { fname: true, lname: true } },
                        student: { select: { fname: true, lname: true } },
                    },
                },
                consultation: {
                    select: {
                        nurse: {
                            select: {
                                username: true,
                                employee: { select: { fname: true, lname: true } },
                                student: { select: { fname: true, lname: true } },
                            },
                        },
                    },
                },
                patient: {
                    select: {
                        username: true,
                        student: { select: { fname: true, lname: true, student_id: true } },
                        employee: { select: { fname: true, lname: true, employee_id: true } },
                    },
                },
                createdBy: {
                    select: {
                        role: true,
                        username: true,
                        employee: { select: { fname: true, lname: true } },
                        student: { select: { fname: true, lname: true, is_working_scholar: true } },
                    },
                },
            },
        });

        const payload = appointments
            .map((appointment) => {
                const nurse = appointment.consultation?.nurse;
                const staffRoleLabel = nurse
                    ? "Nurse"
                    : appointment.createdBy?.student?.is_working_scholar
                        ? "Scholar"
                        : "Doctor";

                return {
                    id: appointment.appointment_id,
                    date: formatManilaISODate(appointment.appointment_timestart),
                    timestart: appointment.appointment_timestart.toISOString(),
                    timeend: appointment.appointment_timeend.toISOString(),
                    status: appointment.status,
                    clinic: appointment.clinic.clinic_name,
                    staffRole: staffRoleLabel,
                    doctorName: formatPersonName(appointment.doctor),
                    nurseName: nurse ? formatPersonName(nurse) : null,
                    patientName: formatPersonName(appointment.patient),
                    patientType: formatPatientType(appointment.patient),
                    createdBy: appointment.createdBy
                        ? {
                              role: appointment.createdBy.role,
                              name: formatPersonName(appointment.createdBy),
                          }
                        : null,
                };
            })
            .filter((appointment) => {
                if (!staffRole || staffRole === "all") return true;
                return appointment.staffRole.toLowerCase() === staffRole.toLowerCase();
            });

        return NextResponse.json(payload);
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("[GET /api/nurse/appointments]", err);
        return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
    }
}
