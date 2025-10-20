// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// mirror Prisma enums manually (since they aren’t exported)
type Role = "NURSE" | "DOCTOR" | "SCHOLAR" | "PATIENT" | "ADMIN";
type AccountStatus = "Active" | "Inactive";

// --------------------
// Error Handler Helper
// --------------------
function handleError(error: unknown, message = "Server error") {
    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error("Unexpected error:", error);
    }
    return NextResponse.json({ error: message }, { status: 500 });
}

// --------------------
// Create User (POST)
// --------------------
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const role = (body.role as string).toUpperCase() as Role;
        const fname: string = body.fname;
        const mname: string | null = body.mname || null;
        const lname: string = body.lname;
        const date_of_birth: Date = new Date(body.date_of_birth);
        const gender: "Male" | "Female" = body.gender;

        const employee_id: string | null = body.employee_id || null;
        const student_id: string | null = body.student_id || null;
        const school_id: string | null = body.school_id || null;
        const patientType: "student" | "employee" | null = body.patientType || null;

        // Generate random password
        const rawPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        let username: string | null = null;
        let createdId: string | null = null;

        if (role === "NURSE" || role === "DOCTOR") {
            username = employee_id || `EMP-${Date.now()}`;
            createdId = username;
        } else if (role === "PATIENT") {
            if (patientType === "student") {
                username = student_id || `STUD-${Date.now()}`;
                createdId = username;
            } else {
                username = employee_id || `EMP-${Date.now()}`;
                createdId = username;
            }
        } else if (role === "SCHOLAR") {
            username = school_id || `SCH-${Date.now()}`;
            createdId = username;
        }

        // Create User first
        const user = await prisma.users.create({
            data: {
                username: username!,
                password: hashedPassword,
                role, // now typed as Role
            },
        });

        // Attach profile
        let finalId = createdId;

        if (role === "NURSE" || role === "DOCTOR") {
            const emp = await prisma.employee.create({
                data: {
                    user_id: user.user_id,
                    employee_id: createdId!,
                    fname,
                    mname,
                    lname,
                    date_of_birth,
                    gender,
                },
            });
            finalId = emp.employee_id;
        } else if (role === "PATIENT" && patientType === "student") {
            const stud = await prisma.student.create({
                data: {
                    user_id: user.user_id,
                    student_id: createdId!,
                    fname,
                    mname,
                    lname,
                    date_of_birth,
                    gender,
                },
            });
            finalId = stud.student_id;
        } else if (role === "PATIENT" && patientType === "employee") {
            const emp = await prisma.employee.create({
                data: {
                    user_id: user.user_id,
                    employee_id: createdId!,
                    fname,
                    mname,
                    lname,
                    date_of_birth,
                    gender,
                },
            });
            finalId = emp.employee_id;
        } else if (role === "SCHOLAR") {
            const stud = await prisma.student.create({
                data: {
                    user_id: user.user_id,
                    student_id: createdId!,
                    fname,
                    mname,
                    lname,
                    date_of_birth,
                    gender,
                },
            });
            finalId = stud.student_id;
        }

        return NextResponse.json(
            {
                success: true,
                id: finalId,
                password: rawPassword,
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        return handleError(error, "Failed to create user");
    }
}

// --------------------
// Get Users (GET)
// --------------------
export async function GET() {
    try {
        const users = await prisma.users.findMany({
            include: {
                student: true,
                employee: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const formatted = users.map((u: typeof users[number]) => ({
            user_id: u.user_id,
            username: u.username,
            role: u.role as Role,
            status: u.status as AccountStatus,
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

// --------------------
// Update Status (PATCH)
// --------------------
export async function PATCH(req: Request) {
    try {
        const { userId, status } = (await req.json()) as {
            userId: string;
            status: AccountStatus;
        };

        await prisma.users.update({
            where: { user_id: userId },
            data: { status }, // typed properly
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleError(error, "Failed to update status");
    }
}
