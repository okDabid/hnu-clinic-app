import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";
import { Prisma, BloodType, Department, Role, AccountStatus } from "@prisma/client";
import { handleAuthError, requireRole } from "@/lib/authorization";
import { z } from "zod";

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

const createUserSchema = z
    .object({
        role: z.nativeEnum(Role),
        fname: z.string().trim().min(1, "First name is required."),
        mname: z.string().trim().optional(),
        lname: z.string().trim().min(1, "Last name is required."),
        employee_id: z
            .string()
            .trim()
            .optional()
            .transform((value) => (value?.length ? value : undefined)),
        student_id: z
            .string()
            .trim()
            .optional()
            .transform((value) => (value?.length ? value : undefined)),
        school_id: z
            .string()
            .trim()
            .optional()
            .transform((value) => (value?.length ? value : undefined)),
        patientType: z.enum(["student", "employee"]).optional(),
        specialization: z.enum(["Physician", "Dentist"]).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.role === Role.PATIENT) {
            if (!data.patientType) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Please specify if the patient is a student or an employee.",
                    path: ["patientType"],
                });
            }

            if (data.patientType === "student" && !data.student_id) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Student ID is required for student patients.",
                    path: ["student_id"],
                });
            }

            if (data.patientType === "employee" && !data.employee_id) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Employee ID is required for employee patients.",
                    path: ["employee_id"],
                });
            }
        } else if (data.patientType) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Patient type is only applicable when creating patient accounts.",
                path: ["patientType"],
            });
        }

        if ((data.role === Role.NURSE || data.role === Role.DOCTOR) && !data.employee_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Employee ID is required for nurse and doctor accounts.",
                path: ["employee_id"],
            });
        }

        if (data.role === Role.DOCTOR && !data.specialization) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please select a specialization for the doctor.",
                path: ["specialization"],
            });
        }

        if (data.role === Role.SCHOLAR && !data.school_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "School ID is required for working scholar accounts.",
                path: ["school_id"],
            });
        }
    })
    .transform((data) => ({
        ...data,
        mname: data.mname?.trim() || null,
        employee_id: data.employee_id ?? null,
        student_id: data.student_id ?? null,
        school_id: data.school_id ?? null,
        specialization: data.specialization ?? null,
    }));

// ---------------- CREATE USER ----------------
export async function POST(req: Request) {
    try {
        await requireRole([Role.NURSE]);

        const payload = await req.json();
        const parsed = createUserSchema.safeParse(payload);

        if (!parsed.success) {
            const message = parsed.error.issues[0]?.message ?? "Invalid request body.";
            return NextResponse.json({ error: message }, { status: 400 });
        }

        const roleEnum = parsed.data.role;

        // Determine username
        let username: string;
        if (roleEnum === Role.NURSE || roleEnum === Role.DOCTOR) {
            username = parsed.data.employee_id as string;
        } else if (roleEnum === Role.PATIENT && parsed.data.patientType === "student") {
            username = parsed.data.student_id as string;
        } else if (roleEnum === Role.PATIENT && parsed.data.patientType === "employee") {
            username = parsed.data.employee_id as string;
        } else if (roleEnum === Role.SCHOLAR) {
            username = parsed.data.school_id as string;
        } else {
            username = `${parsed.data.fname.toLowerCase()}.${parsed.data.lname.toLowerCase()}`;
        }

        const finalUsername = await ensureUniqueUsername(username);

        // Generate password
        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Create the user record, including specialization when provided
        const newUser = await prisma.users.create({
            data: {
                username: finalUsername,
                password: hashedPassword,
                role: roleEnum,
                status: AccountStatus.Active,
                specialization:
                    roleEnum === Role.DOCTOR
                        ? parsed.data.specialization === "Physician"
                            ? "Physician"
                            : parsed.data.specialization === "Dentist"
                                ? "Dentist"
                                : null
                        : null,
            },
        });

        // Shared fields
        const sharedProfileData = {
            fname: parsed.data.fname,
            mname: parsed.data.mname,
            lname: parsed.data.lname,
            bloodtype: bloodTypeMap[payload.bloodtype] || null,
            address: payload.address ?? null,
            allergies: payload.allergies ?? null,
            medical_cond: payload.medical_cond ?? null,
            emergencyco_name: payload.emergencyco_name ?? null,
            emergencyco_num: payload.emergencyco_num ?? null,
            emergencyco_relation: payload.emergencyco_relation ?? null,
            email: payload.email?.trim() || null,
            contactno: payload.phone?.trim() || null,
        };

        // Create profile based on role
        if (roleEnum === Role.PATIENT && parsed.data.patientType === "student") {
            const uniqueStudentId = await ensureUniqueStudentId(parsed.data.student_id as string);
            const department =
                payload.department && Object.values(Department).includes(payload.department)
                    ? (payload.department as Department)
                    : null;
            await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: uniqueStudentId,
                    department,
                    program: payload.program ?? null,
                    year_level: payload.year_level ?? null,
                    ...sharedProfileData,
                },
            });
        }

        if (roleEnum === Role.PATIENT && parsed.data.patientType === "employee") {
            const uniqueEmployeeId = await ensureUniqueEmployeeId(parsed.data.employee_id as string);
            await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: uniqueEmployeeId,
                    ...sharedProfileData,
                },
            });
        }

        if (roleEnum === Role.NURSE || roleEnum === Role.DOCTOR) {
            const uniqueEmployeeId = await ensureUniqueEmployeeId(parsed.data.employee_id as string);
            await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: uniqueEmployeeId,
                    ...sharedProfileData,
                },
            });
        }

        if (roleEnum === Role.SCHOLAR) {
            const uniqueStudentId = await ensureUniqueStudentId(parsed.data.school_id as string);
            const department =
                payload.department && Object.values(Department).includes(payload.department)
                    ? (payload.department as Department)
                    : null;
            await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: uniqueStudentId,
                    department,
                    program: payload.program ?? null,
                    year_level: payload.year_level ?? null,
                    ...sharedProfileData,
                },
            });
        }

        return NextResponse.json({
            id: username.replace(/-\d+$/, ""), // hide "-1" suffix if any
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
                specialization: u.specialization,
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

        const { user_id, newStatus } = await req.json();

        if (!user_id || (newStatus !== "Active" && newStatus !== "Inactive")) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        // Prevent self-deactivation
        const currentUser = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { user_id: true },
        });

        if (currentUser && currentUser.user_id === user_id) {
            return NextResponse.json(
                { error: "You cannot deactivate your own account." },
                { status: 403 }
            );
        }

        // Check if target exists
        const target = await prisma.users.findUnique({
            where: { user_id },
            select: { status: true },
        });

        if (!target) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
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
