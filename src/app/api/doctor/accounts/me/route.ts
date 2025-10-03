import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

// Utility: safe employee profile update
function buildEmployeeUpdateInput(raw: Record<string, unknown>): Prisma.EmployeeUpdateInput {
    const data: Prisma.EmployeeUpdateInput = {};
    if (typeof raw.fname === "string") data.fname = raw.fname;
    if (typeof raw.mname === "string") data.mname = raw.mname;
    if (typeof raw.lname === "string") data.lname = raw.lname;
    if (typeof raw.contactno === "string") data.contactno = raw.contactno;
    if (typeof raw.address === "string") data.address = raw.address;
    if (typeof raw.bloodtype === "string") data.bloodtype = raw.bloodtype;
    if (typeof raw.allergies === "string") data.allergies = raw.allergies;
    if (typeof raw.medical_cond === "string") data.medical_cond = raw.medical_cond;
    if (typeof raw.emergencyco_name === "string") data.emergencyco_name = raw.emergencyco_name;
    if (typeof raw.emergencyco_num === "string") data.emergencyco_num = raw.emergencyco_num;
    if (typeof raw.emergencyco_relation === "string") data.emergencyco_relation = raw.emergencyco_relation;

    if (typeof raw.date_of_birth === "string") {
        const d = new Date(raw.date_of_birth);
        if (!isNaN(d.getTime())) data.date_of_birth = d;
    }
    if (raw.gender === "Male" || raw.gender === "Female") {
        data.gender = raw.gender;
    }

    return data;
}

// -------- GET own doctor profile --------
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { employee: true },
        });

        if (!user || !user.employee || user.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
        }

        return NextResponse.json({
            accountId: user.user_id,
            username: user.username,
            role: user.role,
            status: user.status,
            profile: user.employee,
        });
    } catch (err) {
        console.error("[GET /api/doctor/accounts/me]", err);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

// -------- UPDATE own doctor profile --------
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
            include: { employee: true },
        });

        if (!user || !user.employee || user.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
        }

        const data = buildEmployeeUpdateInput(profile);

        await prisma.employee.update({
            where: { user_id: session.user.id },
            data,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/doctor/accounts/me]", err);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
