import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";
import { Prisma, Gender, BloodType } from "@prisma/client";
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

// ---------------- CREATE USER ----------------
export async function POST(req: Request) {
    try {
        const payload = await req.json();

        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Determine username
        let username: string;
        if (payload.role === "NURSE" || payload.role === "DOCTOR") {
            username = payload.employee_id;
        } else if (payload.role === "PATIENT" && payload.patientType === "student") {
            username = payload.student_id;
        } else if (payload.role === "PATIENT" && payload.patientType === "employee") {
            username = payload.employee_id;
        } else if (payload.role === "SCHOLAR") {
            username = payload.school_id;
        } else {
            username = `${payload.fname.toLowerCase()}.${payload.lname.toLowerCase()}`;
        }

        // ✅ Create user (no email or phone in Users)
        const newUser = await prisma.users.create({
            data: {
                username,
                password: hashedPassword,
                role: payload.role,
                status: "Active",
            },
        });

        // Shared fields
        const sharedProfileData = {
            fname: payload.fname,
            mname: payload.mname,
            lname: payload.lname,
            date_of_birth: new Date(payload.date_of_birth),
            gender: payload.gender as Gender,
            bloodtype: bloodTypeMap[payload.bloodtype] || null,
            address: payload.address ?? null,
            allergies: payload.allergies ?? null,
            medical_cond: payload.medical_cond ?? null,
            emergencyco_name: payload.emergencyco_name ?? null,
            emergencyco_num: payload.emergencyco_num ?? null,
            emergencyco_relation: payload.emergencyco_relation ?? null,
            email: payload.email?.trim() || null,     // ✅ now stored here
            contactno: payload.phone?.trim() || null, // ✅ now stored here
        };

        // Create profile based on role
        if (payload.role === "PATIENT" && payload.patientType === "student") {
            await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: payload.student_id,
                    department: payload.department ?? null,
                    program: payload.program ?? null,
                    year_level: payload.year_level ?? null,
                    ...sharedProfileData,
                },
            });
        }

        if (payload.role === "PATIENT" && payload.patientType === "employee") {
            await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: payload.employee_id,
                    ...sharedProfileData,
                },
            });
        }

        if (payload.role === "NURSE" || payload.role === "DOCTOR") {
            await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: payload.employee_id,
                    ...sharedProfileData,
                },
            });
        }

        if (payload.role === "SCHOLAR") {
            await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: payload.school_id,
                    department: payload.department ?? null,
                    program: payload.program ?? null,
                    year_level: payload.year_level ?? null,
                    ...sharedProfileData,
                },
            });
        }

        // Return generated credentials
        return NextResponse.json({
            id: username,
            password: plainPassword,
        });
    } catch (err) {
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
            let displayId = u.username;

            if (u.role === "PATIENT") {
                displayId = u.student?.student_id ?? u.employee?.employee_id ?? u.username;
            } else if (u.role === "NURSE" || u.role === "DOCTOR") {
                displayId = u.employee?.employee_id ?? u.username;
            } else if (u.role === "SCHOLAR") {
                displayId = u.student?.student_id ?? u.username;
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
                email: u.student?.email ?? u.employee?.email ?? null, // ✅ pulled from sub-tables
                contactno: u.student?.contactno ?? u.employee?.contactno ?? null, // ✅ same here
                bloodtype: bloodTypeDisplay,
            };
        });

        return NextResponse.json(formatted);
    } catch (err) {
        console.error("[GET /api/nurse/accounts]", err);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// ---------------- UPDATE USER ----------------
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "NURSE" && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { user_id, newStatus, profile } = await req.json();

        if (newStatus && session.user.id === user_id) {
            return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
        }

        if (newStatus) {
            if (!["Active", "Inactive"].includes(newStatus)) {
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

            const normalizeProfile = <T extends Prisma.StudentUpdateInput | Prisma.EmployeeUpdateInput>(
                raw: Record<string, unknown>,
                allowed: readonly string[]
            ): Partial<T> => {
                const safe: Partial<T> = {};
                for (const [key, value] of Object.entries(raw)) {
                    if (!allowed.includes(key)) continue;
                    if (key === "date_of_birth" && typeof value === "string") {
                        (safe as Record<string, unknown>)[key] = new Date(value);
                    } else if (key === "gender" && (value === "Male" || value === "Female")) {
                        (safe as Record<string, unknown>)[key] = value as Gender;
                    } else if (key === "bloodtype" && typeof value === "string") {
                        (safe as Record<string, unknown>)[key] = bloodTypeMap[value] || (value as BloodType);
                    } else {
                        (safe as Record<string, unknown>)[key] = value;
                    }
                }
                return safe;
            };

            const allowedFields = [
                "fname", "mname", "lname", "contactno", "email", "address",
                "bloodtype", "allergies", "medical_cond",
                "emergencyco_name", "emergencyco_num", "emergencyco_relation",
                "date_of_birth", "gender",
            ] as const;

            if ((user.role === "PATIENT" || user.role === "SCHOLAR") && user.student) {
                const safeProfile = normalizeProfile<Prisma.StudentUpdateInput>(profile, allowedFields);
                await prisma.student.update({ where: { user_id }, data: safeProfile });
            }

            if ((user.role === "NURSE" || user.role === "DOCTOR" || user.role === "PATIENT") && user.employee) {
                const safeProfile = normalizeProfile<Prisma.EmployeeUpdateInput>(profile, allowedFields);
                await prisma.employee.update({ where: { user_id }, data: safeProfile });
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/nurse/accounts] ERROR:", err);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}
