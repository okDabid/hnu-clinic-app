import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AccountStatus, Role } from "@prisma/client";

// define minimal relation types manually
type UserRelation = {
    user: {
        user_id: string;
        role: Role;
        password: string;
        status: AccountStatus;
    } | null;
};

type EmployeeWithUser = {
    fname: string;
    lname: string;
} & UserRelation;

type StudentWithUser = {
    fname: string;
    lname: string;
} & UserRelation;

function trimmed(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const roleInput = trimmed(body.role).toUpperCase();

        if (!Object.values(Role).includes(roleInput as Role)) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        if (roleInput === Role.ADMIN) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const role = roleInput as Role;
        const employeeId = trimmed(body.employee_id);
        const schoolId = trimmed(body.school_id);
        const patientId = trimmed(body.patient_id);
        const password = String(body.password ?? "");

        let userRecord: EmployeeWithUser | StudentWithUser | null = null;

        if (role === Role.NURSE || role === Role.DOCTOR) {
            userRecord = (await prisma.employee.findUnique({
                where: { employee_id: employeeId },
                include: {
                    user: {
                        select: {
                            user_id: true,
                            role: true,
                            password: true,
                            status: true,
                        },
                    },
                },
            })) as EmployeeWithUser | null;
        } else if (role === Role.SCHOLAR) {
            userRecord = (await prisma.student.findUnique({
                where: { student_id: schoolId },
                include: {
                    user: {
                        select: {
                            user_id: true,
                            role: true,
                            password: true,
                            status: true,
                        },
                    },
                },
            })) as StudentWithUser | null;
        } else if (role === Role.PATIENT) {
            userRecord =
                ((await prisma.student.findUnique({
                    where: { student_id: patientId },
                    include: {
                        user: {
                            select: {
                                user_id: true,
                                role: true,
                                password: true,
                                status: true,
                            },
                        },
                    },
                })) as StudentWithUser | null) ||
                ((await prisma.employee.findUnique({
                    where: { employee_id: patientId },
                    include: {
                        user: {
                            select: {
                                user_id: true,
                                role: true,
                                password: true,
                                status: true,
                            },
                        },
                    },
                })) as EmployeeWithUser | null);
        }

        // not found
        if (!userRecord || !userRecord.user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // password check
        const isValid = await bcrypt.compare(password, userRecord.user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        if (userRecord.user.role !== role) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        if (userRecord.user.status !== AccountStatus.Active) {
            return NextResponse.json(
                { error: "Account inactive" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            fullName: `${userRecord.fname} ${userRecord.lname}`,
            role: userRecord.user.role,
            user_id: userRecord.user.user_id,
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
