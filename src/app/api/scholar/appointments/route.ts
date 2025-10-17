import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AppointmentStatus, Prisma, Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { manilaNow } from "@/lib/time";

function parseDate(value: string | null, type: "start" | "end") {
    if (!value) return null;
    const iso = type === "start" ? `${value}T00:00:00+08:00` : `${value}T23:59:59+08:00`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
}

function buildPatientName(patient: {
    username: string;
    student: { fname: string | null; mname: string | null; lname: string | null } | null;
    employee: { fname: string | null; mname: string | null; lname: string | null } | null;
}) {
    const student = patient.student;
    if (student) {
        return [student.fname, student.mname, student.lname].filter(Boolean).join(" ") || patient.username;
    }
    const employee = patient.employee;
    if (employee) {
        return [employee.fname, employee.mname, employee.lname].filter(Boolean).join(" ") || patient.username;
    }
    return patient.username;
}

function buildPatientIdentifier(patient: {
    student: { student_id: string } | null;
    employee: { employee_id: string } | null;
}) {
    if (patient.student?.student_id) return patient.student.student_id;
    if (patient.employee?.employee_id) return patient.employee.employee_id;
    return "";
}

function buildPatientType(patient: {
    student: { student_id: string } | null;
    employee: { employee_id: string } | null;
}) {
    if (patient.student) return "Student";
    if (patient.employee) return "Employee";
    return "Patient";
}

function buildStaffName(staff: {
    username: string;
    employee: { fname: string | null; mname: string | null; lname: string | null } | null;
    student: { fname: string | null; mname: string | null; lname: string | null } | null;
} | null) {
    if (!staff) return "";
    const employee = staff.employee;
    if (employee) {
        return [employee.fname, employee.mname, employee.lname].filter(Boolean).join(" ") || staff.username;
    }
    const student = staff.student;
    if (student) {
        return [student.fname, student.mname, student.lname].filter(Boolean).join(" ") || staff.username;
    }
    return staff.username;
}

const ACTIVE_STATUSES: AppointmentStatus[] = [
    AppointmentStatus.Pending,
    AppointmentStatus.Approved,
    AppointmentStatus.Moved,
];

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const account = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { role: true },
        });

        if (!account || account.role !== Role.SCHOLAR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const url = new URL(req.url);
        const statusParam = url.searchParams.get("status");
        const fromParam = url.searchParams.get("from");
        const toParam = url.searchParams.get("to");
        const takeParam = url.searchParams.get("take");

        const now = manilaNow();
        const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const defaultTo = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const appointmentWhere: Prisma.AppointmentWhereInput = {
            appointment_timestart: {
                gte: parseDate(fromParam, "start") ?? defaultFrom,
                lte: parseDate(toParam, "end") ?? defaultTo,
            },
        };

        if (statusParam && statusParam !== "all") {
            if (statusParam === "active") {
                appointmentWhere.status = { in: ACTIVE_STATUSES };
            } else if ((Object.values(AppointmentStatus) as string[]).includes(statusParam)) {
                appointmentWhere.status = statusParam as AppointmentStatus;
            }
        }

        const take = takeParam ? Number.parseInt(takeParam, 10) : 200;

        const appointments = await prisma.appointment.findMany({
            where: appointmentWhere,
            orderBy: { appointment_timestart: "asc" },
            take: Number.isNaN(take) ? 200 : Math.min(Math.max(take, 1), 500),
            include: {
                clinic: { select: { clinic_id: true, clinic_name: true } },
                doctor: {
                    select: {
                        user_id: true,
                        username: true,
                        employee: { select: { fname: true, mname: true, lname: true } },
                        student: { select: { fname: true, mname: true, lname: true } },
                    },
                },
                patient: {
                    select: {
                        user_id: true,
                        username: true,
                        student: {
                            select: {
                                student_id: true,
                                fname: true,
                                mname: true,
                                lname: true,
                            },
                        },
                        employee: {
                            select: {
                                employee_id: true,
                                fname: true,
                                mname: true,
                                lname: true,
                            },
                        },
                    },
                },
            },
        });

        const formatted = appointments.map((appointment) => ({
            id: appointment.appointment_id,
            clinic: {
                id: appointment.clinic_id,
                name: appointment.clinic?.clinic_name ?? "",
            },
            doctor: {
                id: appointment.doctor_user_id,
                name: buildStaffName(appointment.doctor),
            },
            patient: {
                id: appointment.patient_user_id,
                name: buildPatientName(appointment.patient),
                identifier: buildPatientIdentifier(appointment.patient),
                type: buildPatientType(appointment.patient),
            },
            start: appointment.appointment_timestart.toISOString(),
            end: appointment.appointment_timeend.toISOString(),
            serviceType: appointment.service_type,
            status: appointment.status,
            remarks: appointment.remarks ?? "",
            createdAt: appointment.createdAt.toISOString(),
            updatedAt: appointment.updatedAt.toISOString(),
        }));

        return NextResponse.json(formatted);
    } catch (err) {
        console.error("[GET /api/scholar/appointments]", err);
        return NextResponse.json(
            { error: "Failed to fetch appointments" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const account = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { role: true },
        });

        if (!account || account.role !== Role.SCHOLAR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const payload = await req.json();
        const appointmentId = payload?.appointment_id as string | undefined;
        const newStatus = payload?.status as AppointmentStatus | undefined;
        const remarks = typeof payload?.remarks === "string" ? payload.remarks : undefined;

        if (!appointmentId) {
            return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });
        }

        if (newStatus && !(Object.values(AppointmentStatus) as AppointmentStatus[]).includes(newStatus)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const existing = await prisma.appointment.findUnique({
            where: { appointment_id: appointmentId },
            select: { appointment_id: true },
        });

        if (!existing) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }

        const data: Prisma.AppointmentUpdateInput = {};
        if (newStatus) data.status = newStatus;
        if (typeof remarks === "string") data.remarks = remarks;

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "No updates provided" }, { status: 400 });
        }

        const updated = await prisma.appointment.update({
            where: { appointment_id: appointmentId },
            data,
            select: {
                appointment_id: true,
                status: true,
                remarks: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            appointment_id: updated.appointment_id,
            status: updated.status,
            remarks: updated.remarks ?? "",
            updatedAt: updated.updatedAt.toISOString(),
        });
    } catch (err) {
        console.error("[PATCH /api/scholar/appointments]", err);
        return NextResponse.json(
            { error: "Failed to update appointment" },
            { status: 500 }
        );
    }
}
