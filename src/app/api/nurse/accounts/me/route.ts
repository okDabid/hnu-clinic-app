import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { Role, Gender } from "@prisma/client";

// Allowed fields for Student
const STUDENT_ALLOWED_FIELDS = [
    "fname", "mname", "lname", "date_of_birth", "gender",
    "department", "program", "specialization", "year_level",
    "contactno", "address", "bloodtype", "allergies", "medical_cond",
    "emergencyco_name", "emergencyco_num", "emergencyco_relation",
] as const;

// Allowed fields for Employee
const EMPLOYEE_ALLOWED_FIELDS = [
    "fname", "mname", "lname", "date_of_birth", "gender",
    "contactno", "address", "bloodtype", "allergies", "medical_cond",
    "emergencyco_name", "emergencyco_num", "emergencyco_relation",
] as const;

type StudentField = (typeof STUDENT_ALLOWED_FIELDS)[number];
type EmployeeField = (typeof EMPLOYEE_ALLOWED_FIELDS)[number];

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { student: true, employee: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const profile = user.student ?? user.employee ?? null;

        return NextResponse.json({
            accountId: user.user_id,
            username: user.username,
            role: user.role,
            status: user.status,
            profile,
        });
    } catch (err) {
        console.error("[GET /api/nurse/accounts/me]", err);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();
        const { profile } = payload as { profile: Record<string, unknown> };

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { student: true, employee: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if ((user.role === Role.PATIENT || user.role === Role.SCHOLAR) && user.student) {
            const safeProfile: Record<StudentField, any> = {} as any;

            for (const key of STUDENT_ALLOWED_FIELDS) {
                if (profile[key] !== undefined) {
                    if (key === "date_of_birth" && typeof profile[key] === "string") {
                        safeProfile[key] = new Date(profile[key] as string);
                    } else if (key === "gender" && typeof profile[key] === "string") {
                        if (profile[key] === "Male" || profile[key] === "Female") {
                            safeProfile[key] = profile[key] as Gender;
                        }
                    } else {
                        safeProfile[key] = profile[key];
                    }
                }
            }

            await prisma.student.update({
                where: { user_id: session.user.id },
                data: safeProfile,
            });
        }

        if (
            (user.role === Role.NURSE ||
                user.role === Role.DOCTOR ||
                user.role === Role.PATIENT) &&
            user.employee
        ) {
            const safeProfile: Record<EmployeeField, any> = {} as any;

            for (const key of EMPLOYEE_ALLOWED_FIELDS) {
                if (profile[key] !== undefined) {
                    if (key === "date_of_birth" && typeof profile[key] === "string") {
                        safeProfile[key] = new Date(profile[key] as string);
                    } else if (key === "gender" && typeof profile[key] === "string") {
                        if (profile[key] === "Male" || profile[key] === "Female") {
                            safeProfile[key] = profile[key] as Gender;
                        }
                    } else {
                        safeProfile[key] = profile[key];
                    }
                }
            }

            await prisma.employee.update({
                where: { user_id: session.user.id },
                data: safeProfile,
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/nurse/accounts/me]", err);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
