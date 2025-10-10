import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";
import {
    Prisma,
    Gender,
    BloodType,
    Department,
    Role,
    AccountStatus,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Generate random password (8 chars)
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const generatePassword = customAlphabet(alphabet, 8);

// Blood type mapping
const bloodTypeMap: Record<string, BloodType> = {
    "A+": BloodType.A_POS,
    "A-": BloodType.A_NEG,
    "B+": BloodType.B_POS,
    "B-": BloodType.B_NEG,
    "AB+": BloodType.AB_POS,
    "AB-": BloodType.AB_NEG,
    "O+": BloodType.O_POS,
    "O-": BloodType.O_NEG,
};

const bloodTypeEnumMap: Record<string, string> = {
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
    O_POS: "O+",
    O_NEG: "O-",
};

// ---------------- UNIQUE ID HELPERS ----------------
async function ensureUniqueUsername(base: string): Promise<string> {
    let candidate = base;
    let n = 1;
    while (await prisma.users.findUnique({ where: { username: candidate } })) {
        candidate = `${base}-${n++}`;
    }
    return candidate;
}

async function ensureUniqueStudentId(value: string): Promise<string> {
    let id = value;
    let n = 1;
    while (await prisma.student.findUnique({ where: { student_id: id } })) {
        id = `${value}-${n++}`;
    }
    return id;
}

async function ensureUniqueEmployeeId(value: string): Promise<string> {
    let id = value;
    let n = 1;
    while (await prisma.employee.findUnique({ where: { employee_id: id } })) {
        id = `${value}-${n++}`;
    }
    return id;
}

// ---------------- CREATE USER ----------------
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();
        const roleEnum = payload.role as Role;

        // Determine username
        let username: string;
        if (roleEnum === Role.NURSE || roleEnum === Role.DOCTOR) {
            username = payload.employee_id;
        } else if (roleEnum === Role.PATIENT && payload.patientType === "student") {
            username = payload.student_id;
        } else if (roleEnum === Role.PATIENT && payload.patientType === "employee") {
            username = payload.employee_id;
        } else if (roleEnum === Role.SCHOLAR) {
            username = payload.school_id;
        } else {
            username = `${payload.fname.toLowerCase()}.${payload.lname.toLowerCase()}`;
        }

        const finalUsername = await ensureUniqueUsername(username);

        // Generate password
        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // ✅ Create user safely
        const newUser = await prisma.users.create({
            data: {
                username: finalUsername,
                password: hashedPassword,
                role: roleEnum,
                status: AccountStatus.Active,
            },
        });

        // Shared fields
        const sharedProfileData = {
            fname: payload.fname,
            mname: payload.mname,
            lname: payload.lname,
            gender: payload.gender as Gender,
            bloodtype: bloodTypeMap[payload.bloodtype] || null,
            address: payload.address ?? null,
            allergies: payload.allergies ?? null,
            medical_cond: payload.medical_cond ?? null,
            emergencyco_name: payload.emergencyco_name ?? null,
            emergencyco_num: payload.emergencyco_num ?? null,
            emergencyco_relation: payload.emergencyco_relation ?? null,
            email: payload.email?.trim() || null,
            contactno: payload.phone?.trim() || null,
            date_of_birth: payload.date_of_birth ? new Date(payload.date_of_birth) : null,
        };

        // Create profile based on role
        if (roleEnum === Role.PATIENT && payload.patientType === "student") {
            const uniqueStudentId = await ensureUniqueStudentId(payload.student_id);
            await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: uniqueStudentId,
                    department:
                        payload.department && Object.values(Department).includes(payload.department)
                            ? (payload.department as Department)
                            : null,
                    program: payload.program ?? null,
                    year_level: payload.year_level ?? null,
                    ...sharedProfileData,
                },
            });
        }

        if (roleEnum === Role.PATIENT && payload.patientType === "employee") {
            const uniqueEmployeeId = await ensureUniqueEmployeeId(payload.employee_id);
            await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: uniqueEmployeeId,
                    ...sharedProfileData,
                },
            });
        }

        if (roleEnum === Role.NURSE || roleEnum === Role.DOCTOR) {
            const uniqueEmployeeId = await ensureUniqueEmployeeId(payload.employee_id);
            await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: uniqueEmployeeId,
                    ...sharedProfileData,
                },
            });
        }

        if (roleEnum === Role.SCHOLAR) {
            const uniqueStudentId = await ensureUniqueStudentId(payload.school_id);
            await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: uniqueStudentId,
                    department:
                        payload.department && Object.values(Department).includes(payload.department)
                            ? (payload.department as Department)
                            : null,
                    program: payload.program ?? null,
                    year_level: payload.year_level ?? null,
                    ...sharedProfileData,
                },
            });
        }

        return NextResponse.json({
            id: username.replace(/-\d+$/, ""), // 👈 hide "-1" etc. from response
            password: plainPassword,
        });
    } catch (err) {
        console.error("[POST /api/nurse/accounts]", err);

        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            const field = (err.meta?.target as string[])?.[0] ?? "field";
            return NextResponse.json(
                { error: `Duplicate ${field} — please use a unique value.` },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

// ---------------- LIST USERS ----------------
export async function GET() {
    try {
        const users = await prisma.users.findMany({
            include: { student: true, employee: true },
        });

        const formatted = users.map((u) => {
            let displayId = u.username.replace(/-\d+$/, ""); // 👈 hide "-1" in UI

            if (u.role === Role.PATIENT) {
                displayId =
                    u.student?.student_id?.replace(/-\d+$/, "") ??
                    u.employee?.employee_id?.replace(/-\d+$/, "") ??
                    u.username.replace(/-\d+$/, "");
            } else if (u.role === Role.NURSE || u.role === Role.DOCTOR) {
                displayId = u.employee?.employee_id?.replace(/-\d+$/, "") ?? u.username.replace(/-\d+$/, "");
            } else if (u.role === Role.SCHOLAR) {
                displayId = u.student?.student_id?.replace(/-\d+$/, "") ?? u.username.replace(/-\d+$/, "");
            }

            const fullName =
                u.student?.fname && u.student?.lname
                    ? `${u.student.fname} ${u.student.lname}`
                    : u.employee?.fname && u.employee?.lname
                        ? `${u.employee.fname} ${u.employee.lname}`
                        : u.username;

            const bloodTypeRaw = u.student?.bloodtype || u.employee?.bloodtype || null;
            const bloodTypeDisplay = bloodTypeRaw ? bloodTypeEnumMap[bloodTypeRaw] || bloodTypeRaw : null;

            return {
                user_id: displayId,
                accountId: u.user_id,
                role: u.role,
                status: u.status,
                fullName,
                email: u.student?.email ?? u.employee?.email ?? null,
                contactno: u.student?.contactno ?? u.employee?.contactno ?? null,
                bloodtype: bloodTypeDisplay,
            };
        });

        return NextResponse.json(formatted);
    } catch (err) {
        console.error("[GET /api/nurse/accounts]", err);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
