import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, Gender, Department, YearLevel, BloodType, Prisma } from "@prisma/client";

// ✅ Enum Validators
function isGender(val: unknown): val is Gender {
    return val === "Male" || val === "Female";
}

function isDepartment(val: unknown): val is Department {
    return Object.values(Department).includes(val as Department);
}

function isYearLevel(val: unknown): val is YearLevel {
    return Object.values(YearLevel).includes(val as YearLevel);
}

function isBloodType(val: unknown): val is BloodType {
    return Object.values(BloodType).includes(val as BloodType);
}

function toDate(val: unknown): Date | undefined {
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === "string") {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
    }
    return undefined;
}

function buildStudentUpdateInput(
    raw: Record<string, unknown>
): Prisma.StudentUpdateInput {
    const data: Prisma.StudentUpdateInput = {};

    if (typeof raw.fname === "string") data.fname = raw.fname;
    if (typeof raw.mname === "string") data.mname = raw.mname;
    if (typeof raw.lname === "string") data.lname = raw.lname;
    if (isGender(raw.gender)) data.gender = raw.gender;

    const dob = toDate(raw.date_of_birth);
    if (dob) data.date_of_birth = dob;

    if (isDepartment(raw.department)) data.department = raw.department;
    if (typeof raw.program === "string") data.program = raw.program;
    if (isYearLevel(raw.year_level)) data.year_level = raw.year_level;
    if (isBloodType(raw.bloodtype)) data.bloodtype = raw.bloodtype;

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
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { student: true },
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (user.role !== Role.PATIENT) return NextResponse.json({ error: "Not a patient" }, { status: 403 });

        return NextResponse.json({
            accountId: user.user_id,
            username: user.username,
            role: user.role,
            status: user.status,
            profile: user.student ?? null,
        });
    } catch (err) {
        console.error("[GET /api/patient/account/me]", err);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

// ---------------- UPDATE OWN PROFILE ----------------
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await req.json();
        const profile = (payload?.profile ?? {}) as Record<string, unknown>;

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { student: true },
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (user.role !== Role.PATIENT || !user.student)
            return NextResponse.json({ error: "Not a patient" }, { status: 403 });

        const data = buildStudentUpdateInput(profile);

        await prisma.student.update({
            where: { user_id: session.user.id },
            data,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/patient/account/me]", err);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
