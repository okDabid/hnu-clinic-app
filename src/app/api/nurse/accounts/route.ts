import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";
import { Prisma, Gender } from "@prisma/client";

// Password generator (8 chars, alphanumeric)
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const generatePassword = customAlphabet(alphabet, 8);

// ---------------- CREATE USER ----------------
export async function POST(req: Request) {
    try {
        const payload = await req.json();

        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        let username: string;
        if (payload.role === "NURSE" || payload.role === "DOCTOR") {
            username = `${payload.employee_id}`;
        } else if (payload.role === "PATIENT" && payload.patientType === "student") {
            username = `${payload.student_id}`;
        } else if (payload.role === "PATIENT" && payload.patientType === "employee") {
            username = `${payload.employee_id}`;
        } else if (payload.role === "SCHOLAR") {
            username = `${payload.school_id}`;
        } else {
            username = `${payload.fname.toLowerCase()}.${payload.lname.toLowerCase()}`;
        }

        const newUser = await prisma.users.create({
            data: {
                username,
                password: hashedPassword,
                role: payload.role,
                status: "Active",
            },
        });

        if (payload.role === "PATIENT" && payload.patientType === "student") {
            await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: payload.student_id,
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
        }

        if (payload.role === "PATIENT" && payload.patientType === "employee") {
            await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: payload.employee_id,
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
        }

        if (payload.role === "NURSE" || payload.role === "DOCTOR") {
            await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: payload.employee_id,
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
        }

        if (payload.role === "SCHOLAR") {
            await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: payload.school_id,
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
        }

        return NextResponse.json({
            id:
                payload.role === "PATIENT" && payload.patientType === "student"
                    ? payload.student_id
                    : (payload.role === "PATIENT" && payload.patientType === "employee") ||
                        payload.role === "NURSE" ||
                        payload.role === "DOCTOR"
                        ? payload.employee_id
                        : payload.role === "SCHOLAR"
                            ? payload.school_id
                            : newUser.username,
            password: plainPassword,
        });
    } catch (err: unknown) {
        console.error("[POST /api/nurse/accounts]", err);
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
            let displayId: string;
            if (u.role === "PATIENT") {
                if (u.student) displayId = u.student.student_id;
                else if (u.employee) displayId = u.employee.employee_id;
                else displayId = u.username;
            } else if (u.role === "NURSE" || u.role === "DOCTOR") {
                displayId = u.employee?.employee_id ?? u.username;
            } else if (u.role === "SCHOLAR") {
                displayId = u.student?.student_id ?? u.username;
            } else {
                displayId = u.username;
            }

            return {
                user_id: displayId,
                accountId: u.user_id,
                role: u.role,
                status: u.status,
                fullName:
                    u.student?.fname && u.student?.lname
                        ? `${u.student.fname} ${u.student.lname}`
                        : u.employee?.fname && u.employee?.lname
                            ? `${u.employee.fname} ${u.employee.lname}`
                            : u.username,
            };
        });

        return NextResponse.json(formatted);
    } catch (err: unknown) {
        console.error("[GET /api/nurse/accounts]", err);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// ---------------- UPDATE USER ----------------
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only NURSE or ADMIN can update accounts
        if (session.user.role !== "NURSE" && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { user_id, newStatus, profile } = await req.json();

        // ✅ Prevent self-deactivation
        if (newStatus && session.user.id === user_id) {
            return NextResponse.json(
                { error: "You cannot deactivate your own account." },
                { status: 400 }
            );
        }

        if (newStatus) {
            if (newStatus !== "Active" && newStatus !== "Inactive") {
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }

            await prisma.users.update({
                where: { user_id },
                data: { status: newStatus },
            });
        }

        if (profile) {
            const user = await prisma.users.findUnique({
                where: { user_id },
                include: { student: true, employee: true },
            });

            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            const allowedStudentFields = [
                "fname", "mname", "lname", "contactno", "address",
                "bloodtype", "allergies", "medical_cond",
                "emergencyco_name", "emergencyco_num", "emergencyco_relation",
                "date_of_birth", "gender",
            ] as const;

            const allowedEmployeeFields = [
                "fname", "mname", "lname", "contactno", "address",
                "bloodtype", "allergies", "medical_cond",
                "emergencyco_name", "emergencyco_num", "emergencyco_relation",
                "date_of_birth", "gender",
            ] as const;

            const normalizeProfile = <
                T extends Prisma.StudentUpdateInput | Prisma.EmployeeUpdateInput,
                K extends keyof T
            >(
                raw: Record<string, unknown>,
                allowed: readonly string[],
            ): Partial<T> => {
                const safe: Partial<T> = {};
                for (const [key, value] of Object.entries(raw)) {
                    if (!allowed.includes(key)) continue;

                    if (key === "date_of_birth" && typeof value === "string") {
                        (safe as Record<string, unknown>)[key] = new Date(value);
                    } else if (key === "gender" && (value === "Male" || value === "Female")) {
                        (safe as Record<string, unknown>)[key] = value as Gender;
                    } else {
                        (safe as Record<string, unknown>)[key] = value;
                    }
                }
                return safe;
            };

            if ((user.role === "PATIENT" || user.role === "SCHOLAR") && user.student) {
                const safeProfile = normalizeProfile<Prisma.StudentUpdateInput, keyof Prisma.StudentUpdateInput>(
                    profile,
                    allowedStudentFields
                );
                await prisma.student.update({ where: { user_id }, data: safeProfile });
            }

            if ((user.role === "NURSE" || user.role === "DOCTOR" || user.role === "PATIENT") && user.employee) {
                const safeProfile = normalizeProfile<Prisma.EmployeeUpdateInput, keyof Prisma.EmployeeUpdateInput>(
                    profile,
                    allowedEmployeeFields
                );
                await prisma.employee.update({ where: { user_id }, data: safeProfile });
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error("[PUT /api/nurse/accounts] ERROR:", err);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}
