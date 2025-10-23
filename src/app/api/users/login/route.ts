import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import {
    createRateLimiter,
    isRateLimited,
    rateLimitResponse,
} from "@/lib/rate-limit";

const loginLimiter = createRateLimiter({
    limit: 5,
    windowMs: 60 * 1000,
    keyPrefix: "user-login",
});

// define minimal relation types manually
type UserRelation = {
    user: {
        user_id: string;
        role: string;
        password: string;
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

export async function POST(req: Request) {
    const rate = await loginLimiter.checkRequest(req);
    if (isRateLimited(rate)) {
        return rateLimitResponse(
            rate,
            "Too many login attempts. Please try again shortly."
        );
    }

    try {
        const { role, employee_id, school_id, patient_id, password } =
            await req.json();

        let userRecord: EmployeeWithUser | StudentWithUser | null = null;

        if (role === "NURSE" || role === "DOCTOR") {
            userRecord = (await prisma.employee.findUnique({
                where: { employee_id },
                include: { user: true },
            })) as EmployeeWithUser | null;
        } else if (role === "SCHOLAR") {
            userRecord = (await prisma.student.findUnique({
                where: { student_id: school_id },
                include: { user: true },
            })) as StudentWithUser | null;
        } else if (role === "PATIENT") {
            userRecord =
                ((await prisma.student.findUnique({
                    where: { student_id: patient_id },
                    include: { user: true },
                })) as StudentWithUser | null) ||
                ((await prisma.employee.findUnique({
                    where: { employee_id: patient_id },
                    include: { user: true },
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
