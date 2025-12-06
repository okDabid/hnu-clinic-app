import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";
import { parseMedicalHistory } from "@/lib/medical-history";
import { Prisma, BloodType, Department, Role, AccountStatus } from "@prisma/client";
import { handleAuthError, requireRole } from "@/lib/authorization";

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
async function ensureUniqueUsername(client: Prisma.TransactionClient, base: string): Promise<string> {
    let candidate = base;
    let n = 1;
    while (await client.users.findUnique({ where: { username: candidate } })) {
        candidate = `${base}-${n++}`;
    }
    return candidate;
}

// ---------------- CREATE USER ----------------
export async function POST(req: Request) {
    try {
        await requireRole([Role.NURSE]);

        const payload = await req.json();
        const roleEnum = payload.role as Role;
        const workingScholar = Boolean(payload.workingScholar);

        // Determine username
        let username: string;
        if (roleEnum === Role.NURSE || roleEnum === Role.DOCTOR) {
            username = payload.employee_id;
        } else if (roleEnum === Role.PATIENT && payload.patientType === "student") {
            username = payload.student_id;
        } else if (roleEnum === Role.PATIENT && payload.patientType === "employee") {
            username = payload.employee_id;
        } else {
            username = `${payload.fname.toLowerCase()}.${payload.lname.toLowerCase()}`;
        }

        const isStudentPatient = roleEnum === Role.PATIENT && payload.patientType === "student";
        const isEmployeePatient = roleEnum === Role.PATIENT && payload.patientType === "employee";
        const isEmployeeRole = roleEnum === Role.NURSE || roleEnum === Role.DOCTOR;

        if (isStudentPatient) {
            const [existingStudent, existingUser] = await Promise.all([
                prisma.student.findUnique({ where: { student_id: payload.student_id } }),
                prisma.users.findUnique({ where: { username } }),
            ]);

            if (existingStudent || existingUser) {
                return NextResponse.json(
                    { error: "Student ID already exists. Please use a unique value." },
                    { status: 400 }
                );
            }
        }

        if (isEmployeePatient || isEmployeeRole) {
            const [existingEmployee, existingUser] = await Promise.all([
                prisma.employee.findUnique({ where: { employee_id: payload.employee_id } }),
                prisma.users.findUnique({ where: { username } }),
            ]);

            if (existingEmployee || existingUser) {
                return NextResponse.json(
                    { error: "Employee ID already exists. Please use a unique value." },
                    { status: 400 }
                );
            }
        }

        // Generate password
        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const medicalConditions = parseMedicalHistory(payload.medical_cond).conditions;

        // Shared fields
        const sharedProfileData = {
            fname: payload.fname,
            mname: payload.mname,
            lname: payload.lname,
            bloodtype: bloodTypeMap[payload.bloodtype] || null,
            address: payload.address ?? null,
            allergies: payload.allergies ?? null,
            medical_cond: { set: medicalConditions },
            emergencyco_name: payload.emergencyco_name ?? null,
            emergencyco_num: payload.emergencyco_num ?? null,
            emergencyco_relation: payload.emergencyco_relation ?? null,
            email: payload.email?.trim() || null,
            contactno: payload.phone?.trim() || null,
        };

        const { finalUsername } = await prisma.$transaction(async (tx) => {
            const finalUsername =
                isStudentPatient || isEmployeePatient || isEmployeeRole
                    ? username
                    : await ensureUniqueUsername(tx, username);

            // Create the user record
            const newUser = await tx.users.create({
                data: {
                    username: finalUsername,
                    password: hashedPassword,
                    role: roleEnum,
                    status: AccountStatus.Active,
                },
            });

            // Create profile based on role
            if (isStudentPatient) {
                const department =
                    payload.department && Object.values(Department).includes(payload.department)
                        ? (payload.department as Department)
                        : null;
                await tx.student.create({
                    data: {
                        user_id: newUser.user_id,
                        student_id: payload.student_id,
                        is_working_scholar: workingScholar,
                        department,
                        program: payload.program ?? null,
                        year_level: payload.year_level ?? null,
                        ...sharedProfileData,
                    },
                });
            }

            if (roleEnum === Role.PATIENT && payload.patientType === "employee") {
                await tx.employee.create({
                    data: {
                        user_id: newUser.user_id,
                        employee_id: payload.employee_id,
                        ...sharedProfileData,
                    },
                });
            }

            if (roleEnum === Role.NURSE || roleEnum === Role.DOCTOR) {
                await tx.employee.create({
                    data: {
                        user_id: newUser.user_id,
                        employee_id: payload.employee_id,
                        specialization:
                            roleEnum === Role.DOCTOR
                                ? payload.specialization === "Physician"
                                    ? "Physician"
                                    : payload.specialization === "Dentist"
                                        ? "Dentist"
                                        : null
                                : null,
                        ...sharedProfileData,
                    },
                });
            }

            return { finalUsername };
        });

        return NextResponse.json({
            id: finalUsername.replace(/-\d+$/, ""), // hide "-1" suffix if any
            password: plainPassword,
        });
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
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
        await requireRole([Role.NURSE]);

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
                specialization: u.employee?.specialization ?? null,
                patientType: u.role === Role.PATIENT ? (u.student ? "student" : "employee") : null,
                isWorkingScholar: u.student?.is_working_scholar ?? false,
            };
        });

        return NextResponse.json(formatted);
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("[GET /api/nurse/accounts]", err);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// ---------------- UPDATE USER STATUS (Activate / Deactivate) ----------------
export async function PUT(req: Request) {
    try {
        const session = await requireRole([Role.NURSE]);

        const { user_id, newStatus, workingScholar } = await req.json();

        if (!user_id) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        // Prevent self-targeting on status changes
        const currentUser = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { user_id: true },
        });

        if (currentUser && currentUser.user_id === user_id && (newStatus === "Inactive" || newStatus === "Active")) {
            return NextResponse.json(
                { error: "You cannot deactivate your own account." },
                { status: 403 }
            );
        }

        // Check target existence with student profile when needed
        const target = await prisma.users.findUnique({
            where: { user_id },
            include: { student: true },
        });

        if (!target) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (typeof workingScholar === "boolean") {
            if (target.role !== Role.PATIENT || !target.student) {
                return NextResponse.json(
                    { error: "Working scholar access can only be set for student patients." },
                    { status: 400 }
                );
            }

            if (target.student.is_working_scholar === workingScholar) {
                return NextResponse.json({ message: "No changes made." });
            }

            await prisma.student.update({
                where: { user_id },
                data: { is_working_scholar: workingScholar },
            });

            return NextResponse.json({
                message: workingScholar
                    ? "Working scholar access enabled for this student."
                    : "Working scholar access removed for this student.",
                isWorkingScholar: workingScholar,
            });
        }

        if (newStatus !== "Active" && newStatus !== "Inactive") {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        if (target.status === newStatus) {
            return NextResponse.json({ message: "No changes made." }, { status: 200 });
        }

        // Update user status
        await prisma.users.update({
            where: { user_id },
            data: { status: newStatus },
        });

        return NextResponse.json({
            message: `User ${newStatus === "Active" ? "activated" : "deactivated"} successfully.`,
        });
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("[PUT /api/nurse/accounts]", err);
        return NextResponse.json(
            { error: "Failed to update account status" },
            { status: 500 }
        );
    }
}
