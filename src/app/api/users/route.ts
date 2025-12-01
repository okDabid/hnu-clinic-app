// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role, AccountStatus, Prisma } from "@prisma/client";
import { generateRandomPassword } from "@/lib/security";
import { handleAuthError, requireRole } from "@/lib/authorization";

// --------------------
// Error Handler Helper
// --------------------
const errorResponse = (message: string, status = 400) =>
    NextResponse.json({ error: message }, { status });

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
        await requireRole([Role.NURSE]);

        const body = await req.json();

        const roleInput = String(body.role ?? "").toUpperCase();
        if (!Object.values(Role).includes(roleInput as Role)) {
            return errorResponse("Invalid role specified");
        }
        const role = roleInput as Role;
        const fname: string = body.fname;
        const mname: string | null = body.mname || null;
        const lname: string = body.lname;
        const date_of_birth: Date = new Date(body.date_of_birth);
        const gender: "Male" | "Female" = body.gender;

        const employee_id: string | null = body.employee_id || null;
        const student_id: string | null = body.student_id || null;
        const school_id: string | null = body.school_id || null;
        const patientType: "student" | "employee" | null = body.patientType || null;

        if ((role === Role.NURSE || role === Role.DOCTOR) && !employee_id) {
            return errorResponse("Employee ID is required for this role.");
        }

        if (role === Role.PATIENT && !patientType) {
            return errorResponse("Patient type is required for patient accounts.");
        }

        if (role === Role.PATIENT && patientType === "student" && !student_id) {
            return errorResponse("Student ID is required for student patients.");
        }

        if (role === Role.PATIENT && patientType === "employee" && !employee_id) {
            return errorResponse("Employee ID is required for employee patients.");
        }

        if (role === Role.SCHOLAR && !school_id) {
            return errorResponse("School ID is required for scholars.");
        }

        // Generate random password
        const rawPassword = generateRandomPassword(12);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        let username: string | null = null;
        let createdId: string | null = null;

        if (role === Role.NURSE || role === Role.DOCTOR) {
            username = employee_id;
            createdId = employee_id;
        } else if (role === Role.PATIENT) {
            if (patientType === "student") {
                username = student_id;
                createdId = student_id;
            } else if (patientType === "employee") {
                username = employee_id;
                createdId = employee_id;
            } else {
                return errorResponse("Invalid patient type specified.");
            }
        } else if (role === Role.SCHOLAR) {
            username = school_id;
            createdId = school_id;
        }

        if (!username || !createdId) {
            return errorResponse("Unable to determine account identifier.");
        }

        // Prevent duplicate identifiers
        if (
            (role === Role.NURSE || role === Role.DOCTOR || patientType === "employee") &&
            employee_id
        ) {
            const existingEmployee = await prisma.employee.findUnique({
                where: { employee_id },
            });

            if (existingEmployee) {
                return NextResponse.json(
                    { error: "Employee ID already exists" },
                    { status: 409 }
                );
            }
        }

        if ((role === Role.PATIENT && patientType === "student") || role === Role.SCHOLAR) {
            const existingStudent = await prisma.student.findUnique({
                where: { student_id: createdId },
            });

            if (existingStudent) {
                return NextResponse.json(
                    { error: "Student ID already exists" },
                    { status: 409 }
                );
            }
        }

        // Create User and associated profile atomically
        const { finalId } = await prisma.$transaction(async (tx) => {
            const user = await tx.users.create({
                data: {
                    username,
                    password: hashedPassword,
                    role,
                },
            });

            if (role === Role.NURSE || role === Role.DOCTOR || patientType === "employee") {
                const emp = await tx.employee.create({
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

                return { finalId: emp.employee_id };
            }

            const stud = await tx.student.create({
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

            return { finalId: stud.student_id };
        });

        return NextResponse.json(
            {
                success: true,
                id: finalId,
                password: rawPassword,
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return NextResponse.json(
                { error: "Username or ID already exists" },
                { status: 409 }
            );
        }

        const authResponse = handleAuthError(error);
        if (authResponse) return authResponse;
        return handleError(error, "Failed to create user");
    }
}

// --------------------
// Get Users (GET)
// --------------------
export async function GET() {
    try {
        await requireRole([Role.NURSE]);

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
        const authResponse = handleAuthError(error);
        if (authResponse) return authResponse;
        return handleError(error, "Failed to fetch users");
    }
}

// --------------------
// Update Status (PATCH)
// --------------------
export async function PATCH(req: Request) {
    try {
        await requireRole([Role.NURSE]);

        const { userId, status } = (await req.json()) as {
            userId: string;
            status: AccountStatus;
        };

        if (!Object.values(AccountStatus).includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        await prisma.users.update({
            where: { user_id: userId },
            data: { status }, // typed properly
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const authResponse = handleAuthError(error);
        if (authResponse) return authResponse;
        return handleError(error, "Failed to update status");
    }
}
