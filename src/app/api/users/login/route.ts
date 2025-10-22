import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/withDb";
import { Prisma, Role } from "@prisma/client";

type LoginPayload = {
    role?: string;
    employee_id?: string;
    school_id?: string;
    patient_id?: string;
    password?: string;
};

function normalizeRole(role: unknown): Role | null {
    const value = typeof role === "string" ? role.toUpperCase() : null;
    return value && (Object.values(Role) as string[]).includes(value)
        ? (value as Role)
        : null;
}

function buildWhereClause(
    role: Role,
    payload: LoginPayload
): Prisma.UsersWhereInput | null {
    switch (role) {
        case Role.NURSE:
        case Role.DOCTOR:
            if (!payload.employee_id) return null;
            return {
                role,
                employee: { employee_id: payload.employee_id },
            };
        case Role.SCHOLAR:
            if (!payload.school_id) return null;
            return {
                role,
                student: { student_id: payload.school_id },
            };
        case Role.PATIENT:
            if (!payload.patient_id) return null;
            return {
                OR: [
                    { student: { student_id: payload.patient_id } },
                    { employee: { employee_id: payload.patient_id } },
                ],
            };
        default:
            return null;
    }
}

function deriveFullName(user: {
    student: { fname: string; lname: string } | null;
    employee: { fname: string; lname: string } | null;
}): string {
    if (user.student) return `${user.student.fname} ${user.student.lname}`;
    if (user.employee) return `${user.employee.fname} ${user.employee.lname}`;
    return "";
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as LoginPayload;
        const role = normalizeRole(body.role);

        if (!body.password) {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 }
            );
        }

        if (!role) {
            return NextResponse.json(
                { error: "Invalid role" },
                { status: 400 }
            );
        }

        const where = buildWhereClause(role, body);
        if (!where) {
            return NextResponse.json(
                { error: "Missing login identifier" },
                { status: 400 }
            );
        }

        const user = await withDb(() =>
            prisma.users.findFirst({
                where,
                select: {
                    user_id: true,
                    role: true,
                    password: true,
                    student: { select: { fname: true, lname: true, student_id: true } },
                    employee: { select: { fname: true, lname: true, employee_id: true } },
                },
            })
        );

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const isValid = await bcrypt.compare(body.password, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            fullName: deriveFullName(user),
            role: user.role,
            user_id: user.user_id,
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
