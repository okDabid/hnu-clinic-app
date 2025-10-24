import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";
import {
    Prisma,
    Gender,
    BloodType,
    Department,
    YearLevel,
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

const yearLevelMap: Record<string, YearLevel> = {
    "1st Year": YearLevel.FIRST_YEAR,
    "2nd Year": YearLevel.SECOND_YEAR,
    "3rd Year": YearLevel.THIRD_YEAR,
    "4th Year": YearLevel.FOURTH_YEAR,
    "5th Year": YearLevel.FIFTH_YEAR,
    "Kindergarten": YearLevel.KINDERGARTEN,
    "Kindergarten 1": YearLevel.KINDERGARTEN,
    "Kindergarten 2": YearLevel.KINDERGARTEN,
    "Elementary": YearLevel.ELEMENTARY,
    "Grade 1": YearLevel.ELEMENTARY,
    "Grade 2": YearLevel.ELEMENTARY,
    "Grade 3": YearLevel.ELEMENTARY,
    "Grade 4": YearLevel.ELEMENTARY,
    "Grade 5": YearLevel.ELEMENTARY,
    "Grade 6": YearLevel.ELEMENTARY,
    "Junior High School": YearLevel.JUNIOR_HIGH,
    "Grade 7": YearLevel.JUNIOR_HIGH,
    "Grade 8": YearLevel.JUNIOR_HIGH,
    "Grade 9": YearLevel.JUNIOR_HIGH,
    "Grade 10": YearLevel.JUNIOR_HIGH,
    "Senior High School": YearLevel.SENIOR_HIGH,
    "Grade 11": YearLevel.SENIOR_HIGH,
    "Grade 12": YearLevel.SENIOR_HIGH,
    FIRST_YEAR: YearLevel.FIRST_YEAR,
    SECOND_YEAR: YearLevel.SECOND_YEAR,
    THIRD_YEAR: YearLevel.THIRD_YEAR,
    FOURTH_YEAR: YearLevel.FOURTH_YEAR,
    FIFTH_YEAR: YearLevel.FIFTH_YEAR,
    KINDERGARTEN: YearLevel.KINDERGARTEN,
    ELEMENTARY: YearLevel.ELEMENTARY,
    JUNIOR_HIGH: YearLevel.JUNIOR_HIGH,
    SENIOR_HIGH: YearLevel.SENIOR_HIGH,
};

function mapYearLevel(value: unknown): YearLevel | null {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return yearLevelMap[trimmed] ?? null;
}

// ---------------- UNIQUE ID HELPERS ----------------
type TransactionClient = Prisma.TransactionClient;

async function ensureUniqueUsername(
    tx: TransactionClient,
    base: string
): Promise<string> {
    let candidate = base;
    let n = 1;
    while (await tx.users.findUnique({ where: { username: candidate } })) {
        candidate = `${base}-${n++}`;
    }
    return candidate;
}

async function ensureUniqueStudentId(
    tx: TransactionClient,
    value: string
): Promise<string> {
    let id = value;
    let n = 1;
    while (await tx.student.findUnique({ where: { student_id: id } })) {
        id = `${value}-${n++}`;
    }
    return id;
}

async function ensureUniqueEmployeeId(
    tx: TransactionClient,
    value: string
): Promise<string> {
    let id = value;
    let n = 1;
    while (await tx.employee.findUnique({ where: { employee_id: id } })) {
        id = `${value}-${n++}`;
    }
    return id;
}

const ACCOUNT_MANAGER_ROLES = new Set<Role>([Role.NURSE, Role.ADMIN]);
const MANAGEABLE_ROLES = new Set<Role>([
    Role.NURSE,
    Role.DOCTOR,
    Role.PATIENT,
    Role.SCHOLAR,
]);

function isAccountManager(role: Role | undefined): role is Role {
    return Boolean(role && ACCOUNT_MANAGER_ROLES.has(role));
}

function getTrimmed(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function getOptional(value: unknown): string | null {
    const trimmed = getTrimmed(value);
    return trimmed.length ? trimmed : null;
}

// ---------------- CREATE USER ----------------
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const sessionRole = session?.user?.role as Role | undefined;
        if (!session?.user || !isAccountManager(sessionRole)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();
        const roleStr = getTrimmed(payload.role).toUpperCase();

        if (!Object.values(Role).includes(roleStr as Role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const roleEnum = roleStr as Role;

        if (!MANAGEABLE_ROLES.has(roleEnum)) {
            return NextResponse.json({ error: "Unsupported role" }, { status: 400 });
        }

        const fname = getTrimmed(payload.fname);
        const lname = getTrimmed(payload.lname);
        const mname = getOptional(payload.mname);

        if (!fname || !lname) {
            return NextResponse.json(
                { error: "First and last name are required." },
                { status: 400 }
            );
        }

        const genderStr = getTrimmed(payload.gender);
        const genderEnum = Object.values(Gender).includes(genderStr as Gender)
            ? (genderStr as Gender)
            : null;

        if (!genderEnum) {
            return NextResponse.json(
                { error: "A valid gender is required." },
                { status: 400 }
            );
        }

        const patientType = getTrimmed(payload.patientType).toLowerCase();
        let username: string | null = null;

        if (roleEnum === Role.NURSE || roleEnum === Role.DOCTOR) {
            const employeeId = getTrimmed(payload.employee_id);
            if (!employeeId) {
                return NextResponse.json(
                    { error: "Employee ID is required for this role." },
                    { status: 400 }
                );
            }
            username = employeeId;
        } else if (roleEnum === Role.PATIENT && patientType === "student") {
            const studentId = getTrimmed(payload.student_id);
            if (!studentId) {
                return NextResponse.json(
                    { error: "Student ID is required for this patient." },
                    { status: 400 }
                );
            }
            username = studentId;
        } else if (roleEnum === Role.PATIENT && patientType === "employee") {
            const employeeId = getTrimmed(payload.employee_id);
            if (!employeeId) {
                return NextResponse.json(
                    { error: "Employee ID is required for this patient." },
                    { status: 400 }
                );
            }
            username = employeeId;
        } else if (roleEnum === Role.SCHOLAR) {
            const schoolId = getTrimmed(payload.school_id);
            if (!schoolId) {
                return NextResponse.json(
                    { error: "School ID is required for scholars." },
                    { status: 400 }
                );
            }
            username = schoolId;
        } else {
            username = `${fname.toLowerCase()}.${lname.toLowerCase()}`;
        }

        if (!username) {
            return NextResponse.json(
                { error: "Unable to determine username." },
                { status: 400 }
            );
        }

        let doctorSpecialization: "Physician" | "Dentist" | null = null;
        if (roleEnum === Role.DOCTOR) {
            const specialization = getTrimmed(payload.specialization);
            if (!(["Physician", "Dentist"] as const).includes(
                specialization as "Physician" | "Dentist"
            )) {
                return NextResponse.json(
                    {
                        error:
                            "Doctor specialization must be Physician or Dentist.",
                    },
                    { status: 400 }
                );
            }
            doctorSpecialization = specialization as "Physician" | "Dentist";
        }

        if (roleEnum === Role.PATIENT) {
            if (!patientType || !["student", "employee"].includes(patientType)) {
                return NextResponse.json(
                    {
                        error:
                            "Specify whether the patient is a student or employee.",
                    },
                    { status: 400 }
                );
            }
        }

        const dateOfBirth = payload.date_of_birth
            ? new Date(payload.date_of_birth)
            : null;

        if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
            return NextResponse.json(
                { error: "Invalid date of birth." },
                { status: 400 }
            );
        }

        const bloodtypeInput = getTrimmed(payload.bloodtype).toUpperCase();

        const sharedProfileData = {
            fname,
            mname,
            lname,
            gender: genderEnum,
            bloodtype: bloodTypeMap[bloodtypeInput] || null,
            address: getOptional(payload.address),
            allergies: getOptional(payload.allergies),
            medical_cond: getOptional(payload.medical_cond),
            emergencyco_name: getOptional(payload.emergencyco_name),
            emergencyco_num: getOptional(payload.emergencyco_num),
            emergencyco_relation: getOptional(payload.emergencyco_relation),
            email: getOptional(payload.email),
            contactno: getOptional(payload.phone),
            date_of_birth: dateOfBirth,
        };

        const departmentRaw = getTrimmed(payload.department);
        const departmentEnum =
            departmentRaw &&
            Object.values(Department).includes(departmentRaw as Department)
                ? (departmentRaw as Department)
                : null;
        const program = getOptional(payload.program);
        const yearLevel = mapYearLevel(payload.year_level);

        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const { finalUsername } = await prisma.$transaction(async (tx) => {
            const finalUsername = await ensureUniqueUsername(tx, username as string);

            const newUser = await tx.users.create({
                data: {
                    username: finalUsername,
                    password: hashedPassword,
                    role: roleEnum,
                    status: AccountStatus.Active,
                    specialization: doctorSpecialization,
                },
            });

            if (roleEnum === Role.PATIENT && patientType === "student") {
                const uniqueStudentId = await ensureUniqueStudentId(
                    tx,
                    getTrimmed(payload.student_id)
                );
                await tx.student.create({
                    data: {
                        user_id: newUser.user_id,
                        student_id: uniqueStudentId,
                        department: departmentEnum,
                        program,
                        year_level: yearLevel,
                        ...sharedProfileData,
                    },
                });
            }

            if (roleEnum === Role.PATIENT && patientType === "employee") {
                const uniqueEmployeeId = await ensureUniqueEmployeeId(
                    tx,
                    getTrimmed(payload.employee_id)
                );
                await tx.employee.create({
                    data: {
                        user_id: newUser.user_id,
                        employee_id: uniqueEmployeeId,
                        ...sharedProfileData,
                    },
                });
            }

            if (roleEnum === Role.NURSE || roleEnum === Role.DOCTOR) {
                const uniqueEmployeeId = await ensureUniqueEmployeeId(
                    tx,
                    getTrimmed(payload.employee_id)
                );
                await tx.employee.create({
                    data: {
                        user_id: newUser.user_id,
                        employee_id: uniqueEmployeeId,
                        ...sharedProfileData,
                    },
                });
            }

            if (roleEnum === Role.SCHOLAR) {
                const uniqueStudentId = await ensureUniqueStudentId(
                    tx,
                    getTrimmed(payload.school_id)
                );
                await tx.student.create({
                    data: {
                        user_id: newUser.user_id,
                        student_id: uniqueStudentId,
                        department: departmentEnum,
                        program,
                        year_level: yearLevel,
                        ...sharedProfileData,
                    },
                });
            }

            return { finalUsername };
        });

        return NextResponse.json({
            id: finalUsername,
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
        const session = await getServerSession(authOptions);
        const sessionRole = session?.user?.role as Role | undefined;

        if (!session?.user || !isAccountManager(sessionRole)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await prisma.users.findMany({
            where: {
                role: {
                    in: [Role.NURSE, Role.DOCTOR, Role.PATIENT, Role.SCHOLAR],
                },
            },
            select: {
                user_id: true,
                username: true,
                role: true,
                status: true,
                specialization: true,
                student: {
                    select: {
                        student_id: true,
                        fname: true,
                        lname: true,
                        bloodtype: true,
                    },
                },
                employee: {
                    select: {
                        employee_id: true,
                        fname: true,
                        lname: true,
                        bloodtype: true,
                    },
                },
            },
        });

        const formatted = users.map((u) => {
            let identifier = u.username;

            if (u.role === Role.PATIENT) {
                identifier =
                    u.student?.student_id ??
                    u.employee?.employee_id ??
                    u.username;
            } else if (u.role === Role.NURSE || u.role === Role.DOCTOR) {
                identifier = u.employee?.employee_id ?? u.username;
            } else if (u.role === Role.SCHOLAR) {
                identifier = u.student?.student_id ?? u.username;
            }

            const fullName =
                u.student?.fname && u.student?.lname
                    ? `${u.student.fname} ${u.student.lname}`
                    : u.employee?.fname && u.employee?.lname
                        ? `${u.employee.fname} ${u.employee.lname}`
                        : u.username;

            const bloodTypeRaw = u.student?.bloodtype || u.employee?.bloodtype || null;
            const bloodTypeDisplay = bloodTypeRaw
                ? bloodTypeEnumMap[bloodTypeRaw] || bloodTypeRaw
                : null;

            return {
                user_id: identifier,
                accountId: u.user_id,
                role: u.role,
                status: u.status,
                fullName,
                bloodtype: bloodTypeDisplay,
                specialization: u.specialization,
            };
        });

        return NextResponse.json(formatted);
    } catch (err) {
        console.error("[GET /api/nurse/accounts]", err);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// ---------------- UPDATE USER STATUS (Activate / Deactivate) ----------------
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const sessionRole = session?.user?.role as Role | undefined;
        if (!session?.user || !isAccountManager(sessionRole)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { user_id, newStatus } = await req.json();
        const targetId = getTrimmed(user_id);
        const statusUpdate = getTrimmed(newStatus);

        if (
            !targetId ||
            (statusUpdate !== AccountStatus.Active &&
                statusUpdate !== AccountStatus.Inactive)
        ) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const statusEnum = statusUpdate as AccountStatus;

        // Prevent self-deactivation
        const currentUser = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { user_id: true },
        });

        if (currentUser && currentUser.user_id === targetId) {
            return NextResponse.json(
                { error: "You cannot deactivate your own account." },
                { status: 403 }
            );
        }

        // Check if target exists
        const target = await prisma.users.findUnique({
            where: { user_id: targetId },
            select: { status: true, role: true },
        });

        if (!target) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (target.role === Role.ADMIN && sessionRole !== Role.ADMIN) {
            return NextResponse.json(
                { error: "You cannot change the status of an admin account." },
                { status: 403 }
            );
        }

        if (target.status === statusEnum) {
            return NextResponse.json({ message: "No changes made." }, { status: 200 });
        }

        // Update user status
        await prisma.users.update({
            where: { user_id: targetId },
            data: { status: statusEnum },
        });

        return NextResponse.json({
            message: `User ${
                statusEnum === AccountStatus.Active ? "activated" : "deactivated"
            } successfully.`,
        });
    } catch (err) {
        console.error("[PUT /api/nurse/accounts]", err);
        return NextResponse.json(
            { error: "Failed to update account status" },
            { status: 500 }
        );
    }
}
