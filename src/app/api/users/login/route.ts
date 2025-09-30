import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

// ✅ define payload types with user relation included
type EmployeeWithUser = Prisma.EmployeeGetPayload<{
    include: { user: true };
}>;

type StudentWithUser = Prisma.StudentGetPayload<{
    include: { user: true };
}>;

export async function POST(req: Request) {
    try {
        const { role, employee_id, school_id, patient_id, password } =
            await req.json();

        let userRecord: EmployeeWithUser | StudentWithUser | null = null;

        if (role === "NURSE" || role === "DOCTOR") {
            userRecord = await prisma.employee.findUnique({
                where: { employee_id },
                include: { user: true },
            });
        } else if (role === "SCHOLAR") {
            userRecord = await prisma.student.findUnique({
                where: { student_id: school_id },
                include: { user: true },
            });
        } else if (role === "PATIENT") {
            // check student first
            userRecord =
                (await prisma.student.findUnique({
                    where: { student_id: patient_id },
                    include: { user: true },
                })) ||
                // then check employee
                (await prisma.employee.findUnique({
                    where: { employee_id: patient_id },
                    include: { user: true },
                }));
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
