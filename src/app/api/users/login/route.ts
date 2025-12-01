import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ipKey, withRateLimit } from "@/lib/rate-limit";

type MinimalUserRelation = {
    fname: string;
    lname: string;
    is_working_scholar?: boolean;
    user: {
        user_id: string;
        role: string;
        password: string;
    } | null;
};

const baseSelect = {
    fname: true,
    lname: true,
    user: {
        select: {
            user_id: true,
            role: true,
            password: true,
        },
    },
} as const;

const studentSelect = {
    ...baseSelect,
    is_working_scholar: true,
} as const;

async function findStudentByBaseId(candidateId: string) {
    const exact = await prisma.student.findUnique({
        where: { student_id: candidateId },
        select: studentSelect,
    });

    if (exact) return exact;

    return prisma.student.findFirst({
        where: { student_id: { startsWith: `${candidateId}-` } },
        select: studentSelect,
    });
}

async function handler(req: Request) {
    try {
        const { role, employee_id, patient_id, password } = await req.json();

        const normalizedRole =
            typeof role === "string" ? role.trim().toUpperCase() : "";

        if (typeof password !== "string" || password.length === 0) {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 }
            );
        }

        let userRecord: MinimalUserRelation | null = null;

        if (normalizedRole === "NURSE" || normalizedRole === "DOCTOR") {
            if (typeof employee_id !== "string" || employee_id.length === 0) {
                return NextResponse.json(
                    { error: "Employee ID is required" },
                    { status: 400 }
                );
            }
            userRecord = await prisma.employee.findUnique({
                where: { employee_id },
                select: baseSelect,
            });
        } else if (normalizedRole === "PATIENT") {
            if (typeof patient_id !== "string" || patient_id.length === 0) {
                return NextResponse.json(
                    { error: "Patient ID is required" },
                    { status: 400 }
                );
            }

            const [studentRecord, employeeRecord] = await Promise.all([
                findStudentByBaseId(patient_id),
                prisma.employee.findUnique({
                    where: { employee_id: patient_id },
                    select: baseSelect,
                }),
            ]);

            userRecord = studentRecord || employeeRecord;
        } else {
            return NextResponse.json(
                { error: "Unsupported role" },
                { status: 400 }
            );
        }

        if (!userRecord || !userRecord.user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const isValid = await bcrypt.compare(password, userRecord.user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
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

export const POST = withRateLimit(
    [
        {
            key: ipKey("users:login:ip"),
            limit: 10,
            windowMs: 60_000,
            message: "Too many login attempts from this IP. Please try again shortly.",
        },
        {
            key: async (request) => {
                if (request.method !== "POST") return null;
                try {
                    const body = await request.clone().json();
                    const roleValue = typeof body?.role === "string" ? body.role : "UNKNOWN";
                    const candidateId =
                        (typeof body?.employee_id === "string" && body.employee_id) ||
                        (typeof body?.school_id === "string" && body.school_id) ||
                        (typeof body?.patient_id === "string" && body.patient_id) ||
                        null;
                    if (!candidateId) return null;
                    return `users:login:account:${roleValue.toUpperCase()}:${candidateId.toLowerCase()}`;
                } catch (error) {
                    console.warn("Failed to derive login identifier for rate limiting", error);
                    return null;
                }
            },
            limit: 5,
            windowMs: 60_000,
            message: "Too many attempts for this account. Please wait before retrying.",
        },
    ],
    handler
);
