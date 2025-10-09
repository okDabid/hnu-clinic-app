import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, Gender, Prisma, BloodType } from "@prisma/client";

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

function toDate(val: unknown): Date | undefined {
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === "string") {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
    }
    return undefined;
}

function buildEmployeeUpdateInput(raw: Record<string, unknown>): Prisma.EmployeeUpdateInput {
    const data: Prisma.EmployeeUpdateInput = {};

    if (typeof raw.fname === "string") data.fname = raw.fname;
    if (typeof raw.mname === "string") data.mname = raw.mname;
    if (typeof raw.lname === "string") data.lname = raw.lname;

    const dob = toDate(raw.date_of_birth);
    if (dob) data.date_of_birth = dob;

    if (isGender(raw.gender)) data.gender = raw.gender;

    if (typeof raw.contactno === "string") data.contactno = raw.contactno;
    if (typeof raw.address === "string") data.address = raw.address;
    if (typeof raw.allergies === "string") data.allergies = raw.allergies;
    if (typeof raw.medical_cond === "string") data.medical_cond = raw.medical_cond;
    if (typeof raw.emergencyco_name === "string") data.emergencyco_name = raw.emergencyco_name;
    if (typeof raw.emergencyco_num === "string") data.emergencyco_num = raw.emergencyco_num;
    if (typeof raw.emergencyco_relation === "string") data.emergencyco_relation = raw.emergencyco_relation;

    // ✅ Always update email
    if (typeof raw.email === "string") data.email = raw.email.trim();

    // ✅ Convert "A+" → enum
    if (typeof raw.bloodtype === "string") {
        const mapped =
            bloodTypeMap[raw.bloodtype] ||
            (Object.values(BloodType).includes(raw.bloodtype as BloodType)
                ? (raw.bloodtype as BloodType)
                : undefined);
        if (mapped) data.bloodtype = mapped;
    }

    return data;
}

// ---------------- GET OWN PROFILE ----------------
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { employee: true },
        });

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.role !== Role.NURSE)
            return NextResponse.json({ error: "Not a nurse" }, { status: 403 });

        const profile = user.employee
            ? {
                ...user.employee,
                email: user.employee.email || "",
                bloodtype:
                    user.employee.bloodtype && typeof user.employee.bloodtype === "string"
                        ? bloodTypeEnumMap[user.employee.bloodtype] || user.employee.bloodtype
                        : null,
            }
            : null;

        return NextResponse.json({
            accountId: user.user_id,
            username: user.username,
            role: user.role,
            status: user.status,
            profile,
        });
    } catch (err) {
        console.error("[GET /api/nurse/accounts/me]", err);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

// ---------------- UPDATE OWN PROFILE ----------------
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await req.json();
        const profile = (payload?.profile ?? {}) as Record<string, unknown>;

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { employee: true },
        });

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.role !== Role.NURSE || !user.employee)
            return NextResponse.json({ error: "Not a nurse" }, { status: 403 });

        const data = buildEmployeeUpdateInput(profile);

        const updated = await prisma.employee.update({
            where: { user_id: session.user.id },
            data,
        });

        // ✅ Always return email as a string
        return NextResponse.json({
            success: true,
            profile: {
                ...updated,
                email: updated.email || "",
                bloodtype: updated.bloodtype
                    ? bloodTypeEnumMap[updated.bloodtype] || updated.bloodtype
                    : null,
            },
        });
    } catch (err) {
        console.error("[PUT /api/nurse/accounts/me]", err);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
