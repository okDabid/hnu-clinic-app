// src/app/api/users/route.ts
import crypto from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/withDb";
import { AccountStatus, Role } from "@prisma/client";

type CreateUserPayload = {
    role: string;
    fname: string;
    mname?: string | null;
    lname: string;
    date_of_birth: string;
    gender: "Male" | "Female";
    employee_id?: string | null;
    student_id?: string | null;
    school_id?: string | null;
    patientType?: "student" | "employee" | null;
};

type UpdateStatusPayload = {
    userId?: string;
    status?: string;
};

function handleError(error: unknown, message = "Server error") {
    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error("Unexpected error:", error);
    }
    return NextResponse.json({ error: message }, { status: 500 });
}

function randomId(prefix: string) {
    return `${prefix}-${crypto.randomBytes(4).toString("hex")}`;
}

function normalizeRole(role: unknown): Role | null {
    const value = typeof role === "string" ? role.toUpperCase() : null;
    return value && (Object.values(Role) as string[]).includes(value)
        ? (value as Role)
        : null;
}

function parseDate(value: unknown): Date | null {
    if (!value) return null;
    const date = new Date(value as string);
    return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeStatus(status: unknown): AccountStatus | null {
    if (typeof status !== "string") return null;
    return (Object.values(AccountStatus) as string[]).includes(status)
        ? (status as AccountStatus)
        : null;
}

function resolveUsername(role: Role, ids: Record<string, string | null | undefined>) {
    switch (role) {
        case Role.NURSE:
        case Role.DOCTOR:
            return ids.employee_id ?? randomId("EMP");
        case Role.SCHOLAR:
            return ids.school_id ?? randomId("SCH");
        case Role.PATIENT:
            if (ids.patientType === "student") {
                return ids.student_id ?? randomId("STUD");
            }
            return ids.employee_id ?? randomId("EMP");
        default:
            return randomId("USER");
    }
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as CreateUserPayload;

        const role = normalizeRole(body.role);
        if (!role) {
            return NextResponse.json(
                { error: "Invalid role supplied" },
                { status: 400 }
            );
        }

        if (!body.fname || !body.lname) {
            return NextResponse.json(
                { error: "First name and last name are required" },
                { status: 400 }
            );
        }

        const birthDate = parseDate(body.date_of_birth);
        if (!birthDate) {
            return NextResponse.json(
                { error: "Invalid date of birth" },
                { status: 400 }
            );
        }

        if (body.gender !== "Male" && body.gender !== "Female") {
            return NextResponse.json(
                { error: "Invalid gender value" },
                { status: 400 }
            );
        }

        const username = resolveUsername(role, {
            employee_id: body.employee_id,
            school_id: body.school_id,
            student_id: body.student_id,
            patientType: body.patientType,
        });

        const rawPassword = crypto.randomBytes(12).toString("base64url").slice(0, 12);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const profileId = await withDb(async () =>
            prisma.$transaction(async (tx) => {
                const user = await tx.users.create({
                    data: {
                        username,
                        password: hashedPassword,
                        role,
                    },
                });

                switch (role) {
                    case Role.NURSE:
                    case Role.DOCTOR: {
                        const identifier = body.employee_id ?? username;
                        const emp = await tx.employee.create({
                            data: {
                                user_id: user.user_id,
                                employee_id: identifier,
                                fname: body.fname,
                                mname: body.mname ?? null,
                                lname: body.lname,
                                date_of_birth: birthDate,
                                gender: body.gender,
                            },
                        });
                        return emp.employee_id;
                    }
                    case Role.SCHOLAR: {
                        const identifier = body.school_id ?? username;
                        const stud = await tx.student.create({
                            data: {
                                user_id: user.user_id,
                                student_id: identifier,
                                fname: body.fname,
                                mname: body.mname ?? null,
                                lname: body.lname,
                                date_of_birth: birthDate,
                                gender: body.gender,
                            },
                        });
                        return stud.student_id;
                    }
                    case Role.PATIENT: {
                        const patientType = body.patientType ?? "employee";
                        if (patientType === "student") {
                            const identifier = body.student_id ?? username;
                            const stud = await tx.student.create({
                                data: {
                                    user_id: user.user_id,
                                    student_id: identifier,
                                    fname: body.fname,
                                    mname: body.mname ?? null,
                                    lname: body.lname,
                                    date_of_birth: birthDate,
                                    gender: body.gender,
                                },
                            });
                            return stud.student_id;
                        }

                        const identifier = body.employee_id ?? username;
                        const emp = await tx.employee.create({
                            data: {
                                user_id: user.user_id,
                                employee_id: identifier,
                                fname: body.fname,
                                mname: body.mname ?? null,
                                lname: body.lname,
                                date_of_birth: birthDate,
                                gender: body.gender,
                            },
                        });
                        return emp.employee_id;
                    }
                    default:
                        return user.user_id;
                }
            })
        );

        return NextResponse.json(
            {
                success: true,
                id: profileId,
                password: rawPassword,
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        return handleError(error, "Failed to create user");
    }
}

export async function GET() {
    try {
        const users = await withDb(() =>
            prisma.users.findMany({
                select: {
                    user_id: true,
                    username: true,
                    role: true,
                    status: true,
                    student: {
                        select: { fname: true, lname: true },
                    },
                    employee: {
                        select: { fname: true, lname: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            })
        );

        const formatted = users.map((u) => ({
            user_id: u.user_id,
            username: u.username,
            role: u.role,
            status: u.status,
            fullName: u.student
                ? `${u.student.fname} ${u.student.lname}`
                : u.employee
                    ? `${u.employee.fname} ${u.employee.lname}`
                    : "—",
        }));

        return NextResponse.json(formatted);
    } catch (error: unknown) {
        return handleError(error, "Failed to fetch users");
    }
}

export async function PATCH(req: Request) {
    try {
        const body = (await req.json()) as UpdateStatusPayload;
        if (!body.userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const status = normalizeStatus(body.status);
        if (!status) {
            return NextResponse.json(
                { error: "Invalid status supplied" },
                { status: 400 }
            );
        }

        await withDb(() =>
            prisma.users.update({
                where: { user_id: body.userId! },
                data: { status },
            })
        );

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleError(error, "Failed to update status");
    }
}
