// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role, AccountStatus } from "@prisma/client";
import { generateRandomPassword } from "@/lib/security";
import { handleAuthError, requireRole } from "@/lib/authorization";

type ValidGender = "Male" | "Female";
type PatientType = "student" | "employee";

function normalizeRole(roleInput: unknown): Role | null {
    const normalized = String(roleInput ?? "").toUpperCase();
    return Object.values(Role).includes(normalized as Role)
        ? (normalized as Role)
        : null;
}

function normalizeGender(value: unknown): ValidGender | null {
    if (value === "Male" || value === "Female") return value;
    return null;
}

function parseDate(value: unknown): Date | null {
    const date = new Date(String(value ?? ""));
    return Number.isNaN(date.getTime()) ? null : date;
}

function normalizePatientType(value: unknown): PatientType | null {
    if (value === "student" || value === "employee") return value;
    return null;
}

function normalizeId(value: unknown) {
    const trimmed = String(value ?? "").trim();
    return trimmed || null;
}

function buildIdentifiers(options: {
    role: Role;
    patientType: PatientType | null;
    employeeId: string | null;
    studentId: string | null;
    schoolId: string | null;
}): { username: string; profileId: string; profileType: PatientType | "student" } {
    if (options.role === Role.NURSE || options.role === Role.DOCTOR) {
        const employeeId = options.employeeId ?? `EMP-${Date.now()}`;
        return { username: employeeId, profileId: employeeId, profileType: "employee" };
    }

    if (options.role === Role.PATIENT) {
        const profileType = options.patientType ?? "employee";
        const profileId =
            profileType === "student"
                ? options.studentId ?? `STUD-${Date.now()}`
                : options.employeeId ?? `EMP-${Date.now()}`;
        return { username: profileId, profileId, profileType };
    }

    const schoolId = options.schoolId ?? `SCH-${Date.now()}`;
    return { username: schoolId, profileId: schoolId, profileType: "student" };
}

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
        await requireRole([Role.NURSE]);

        const body = await req.json();
        const role = normalizeRole(body.role);
        if (!role) {
            return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
        }

        const fname = normalizeId(body.fname);
        const mname = normalizeId(body.mname);
        const lname = normalizeId(body.lname);
        const date_of_birth = parseDate(body.date_of_birth);
        const gender = normalizeGender(body.gender);

        if (!fname || !lname) {
            return NextResponse.json(
                { error: "First and last name are required" },
                { status: 400 }
            );
        }
        if (!date_of_birth) {
            return NextResponse.json({ error: "Invalid date of birth" }, { status: 400 });
        }
        if (!gender) {
            return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
        }

        const employee_id = normalizeId(body.employee_id);
        const student_id = normalizeId(body.student_id);
        const school_id = normalizeId(body.school_id);
        const patientType = normalizePatientType(body.patientType);

        if (role === Role.PATIENT && !patientType) {
            return NextResponse.json({ error: "Invalid patient type" }, { status: 400 });
        }

        const identifiers = buildIdentifiers({
            role,
            patientType,
            employeeId: employee_id,
            studentId: student_id,
            schoolId: school_id,
        });

        const rawPassword = generateRandomPassword(12);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const user = await prisma.users.create({
            data: {
                username: identifiers.username,
                password: hashedPassword,
                role,
            },
        });

        const profileData = {
            user_id: user.user_id,
            fname,
            mname,
            lname,
            date_of_birth,
            gender,
        };

        let finalId: string | null = identifiers.profileId;

        if (role === Role.NURSE || role === Role.DOCTOR || identifiers.profileType === "employee") {
            const emp = await prisma.employee.create({
                data: { ...profileData, employee_id: identifiers.profileId },
            });
            finalId = emp.employee_id;
        } else {
            const stud = await prisma.student.create({
                data: { ...profileData, student_id: identifiers.profileId },
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
