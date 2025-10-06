import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { Role, Gender, Prisma, Department, YearLevel, BloodType } from "@prisma/client";

// 🩸 Blood type mapping (text ⇄ enum)
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

// ---------------- HELPERS ----------------
function isGender(val: unknown): val is Gender {
    return val === "Male" || val === "Female";
}

function isEnumValue<T extends Record<string, string>>(enumObj: T, val: unknown): val is T[keyof T] {
    return typeof val === "string" && Object.values(enumObj).includes(val);
}

function toDate(val: unknown): Date | undefined {
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === "string") {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
    }
    return undefined;
}

// ---------------- STUDENT ----------------
function buildStudentUpdateInput(raw: Record<string, unknown>): Prisma.StudentUpdateInput {
    const data: Prisma.StudentUpdateInput = {};

    if (typeof raw.fname === "string") data.fname = raw.fname;
    if (typeof raw.mname === "string") data.mname = raw.mname;
    if (typeof raw.lname === "string") data.lname = raw.lname;

    const dob = toDate(raw.date_of_birth);
    if (dob) data.date_of_birth = dob;

    if (isGender(raw.gender)) data.gender = raw.gender;

    // ✅ ENUM HANDLING
    if (isEnumValue(Department, raw.department)) data.department = raw.department as Department;
    if (typeof raw.program === "string") data.program = raw.program;
    if (isEnumValue(YearLevel, raw.year_level)) data.year_level = raw.year_level as YearLevel;

    // ✅ Convert blood type from "A+" to enum value (A_POS, etc.)
    if (typeof raw.bloodtype === "string") {
        const mapped = bloodTypeMap[raw.bloodtype] || (isEnumValue(BloodType, raw.bloodtype) ? raw.bloodtype : undefined);
        if (mapped) data.bloodtype = mapped as BloodType;
    }

    // Regular strings
    if (typeof raw.contactno === "string") data.contactno = raw.contactno;
    if (typeof raw.address === "string") data.address = raw.address;
    if (typeof raw.allergies === "string") data.allergies = raw.allergies;
    if (typeof raw.medical_cond === "string") data.medical_cond = raw.medical_cond;
    if (typeof raw.emergencyco_name === "string") data.emergencyco_name = raw.emergencyco_name;
    if (typeof raw.emergencyco_num === "string") data.emergencyco_num = raw.emergencyco_num;
    if (typeof raw.emergencyco_relation === "string") data.emergencyco_relation = raw.emergencyco_relation;

    return data;
}

// ---------------- EMPLOYEE ----------------
function buildEmployeeUpdateInput(raw: Record<string, unknown>): Prisma.EmployeeUpdateInput {
    const data: Prisma.EmployeeUpdateInput = {};

    if (typeof raw.fname === "string") data.fname = raw.fname;
    if (typeof raw.mname === "string") data.mname = raw.mname;
    if (typeof raw.lname === "string") data.lname = raw.lname;

    const dob = toDate(raw.date_of_birth);
    if (dob) data.date_of_birth = dob;

    if (isGender(raw.gender)) data.gender = raw.gender;

    // ✅ Convert blood type from "A+" to enum value
    if (typeof raw.bloodtype === "string") {
        const mapped = bloodTypeMap[raw.bloodtype] || (isEnumValue(BloodType, raw.bloodtype) ? raw.bloodtype : undefined);
        if (mapped) data.bloodtype = mapped as BloodType;
    }

    if (typeof raw.contactno === "string") data.contactno = raw.contactno;
    if (typeof raw.address === "string") data.address = raw.address;
    if (typeof raw.allergies === "string") data.allergies = raw.allergies;
    if (typeof raw.medical_cond === "string") data.medical_cond = raw.medical_cond;
    if (typeof raw.emergencyco_name === "string") data.emergencyco_name = raw.emergencyco_name;
    if (typeof raw.emergencyco_num === "string") data.emergencyco_num = raw.emergencyco_num;
    if (typeof raw.emergencyco_relation === "string") data.emergencyco_relation = raw.emergencyco_relation;

    return data;
}

// ---------------- GET OWN PROFILE ----------------
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

        // ✅ Clone the object so TypeScript doesn't complain
        const profile =
            user.student
                ? { ...user.student }
                : user.employee
                    ? { ...user.employee }
                    : null;

        // ✅ Convert bloodtype enum to display string ("A+")
        if (profile?.bloodtype && typeof profile.bloodtype === "string") {
            const mapped = bloodTypeEnumMap[profile.bloodtype];
            if (mapped) {
                if ("bloodtype" in profile) {
                    (profile as { bloodtype: string }).bloodtype = mapped;
                }
            }
        }

        return NextResponse.json({
            accountId: user.user_id,
            username: user.username,
            role: user.role,
            status: user.status,
            profile,
        });
    } catch (err) {
        console.error("[GET /api/nurse/accounts/me]", err);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

// ---------------- UPDATE OWN PROFILE ----------------
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();
        const profile = (payload?.profile ?? {}) as Record<string, unknown>;

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { student: true, employee: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if ((user.role === Role.PATIENT || user.role === Role.SCHOLAR) && user.student) {
            const data = buildStudentUpdateInput(profile);
            await prisma.student.update({
                where: { user_id: session.user.id },
                data,
            });
        }

        if ((user.role === Role.NURSE || user.role === Role.DOCTOR || user.role === Role.PATIENT) && user.employee) {
            const data = buildEmployeeUpdateInput(profile);
            await prisma.employee.update({
                where: { user_id: session.user.id },
                data,
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/nurse/accounts/me]", err);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
