import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, Gender, Prisma } from "@prisma/client";

// 🔹 Helpers
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

function buildEmployeeUpdateInput(
    raw: Record<string, unknown>
): Prisma.EmployeeUpdateInput {
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
            include: { employee: true }, // Doctor profiles stored in Employee
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Not a doctor" }, { status: 403 });
        }

        return NextResponse.json({
            accountId: user.user_id,
            username: user.username,
            role: user.role,
            status: user.status,
            profile: user.employee ?? null,
        });
    } catch (err) {
        console.error("[GET /api/doctor/account/me]", err);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

// ---------------- UPDATE OWN PROFILE ----------------
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();
        const profile = (payload?.profile ?? {}) as Record<string, unknown>;

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { employee: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.role !== Role.DOCTOR || !user.employee) {
            return NextResponse.json({ error: "Not a doctor" }, { status: 403 });
        }

        const data = buildEmployeeUpdateInput(profile);

        await prisma.employee.update({
            where: { user_id: session.user.id },
            data,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/doctor/account/me]", err);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
