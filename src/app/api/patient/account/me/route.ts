import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

// ---------------- GET OWN PROFILE ----------------
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: {
                student: true,
                employee: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.role !== Role.PATIENT) {
            return NextResponse.json({ error: "Not a patient" }, { status: 403 });
        }

        return NextResponse.json({
            accountId: user.user_id,
            username: user.username,
            role: user.role,
            status: user.status,
            profile: user.student ?? user.employee ?? null,
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
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();
        const profile = payload?.profile ?? {};

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: {
                student: true,
                employee: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.role !== Role.PATIENT) {
            return NextResponse.json({ error: "Not a patient" }, { status: 403 });
        }

        // Determine if this patient is a student or employee record
        if (user.student) {
            await prisma.student.update({
                where: { user_id: user.user_id },
                data: {
                    fname: profile.fname ?? user.student.fname,
                    mname: profile.mname ?? user.student.mname,
                    lname: profile.lname ?? user.student.lname,
                    contactno: profile.contactno ?? user.student.contactno,
                    address: profile.address ?? user.student.address,
                    bloodtype: profile.bloodtype ?? user.student.bloodtype,
                    allergies: profile.allergies ?? user.student.allergies,
                    medical_cond: profile.medical_cond ?? user.student.medical_cond,
                    emergencyco_name: profile.emergencyco_name ?? user.student.emergencyco_name,
                    emergencyco_num: profile.emergencyco_num ?? user.student.emergencyco_num,
                    emergencyco_relation: profile.emergencyco_relation ?? user.student.emergencyco_relation,
                },
            });
        } else if (user.employee) {
            await prisma.employee.update({
                where: { user_id: user.user_id },
                data: {
                    fname: profile.fname ?? user.employee.fname,
                    mname: profile.mname ?? user.employee.mname,
                    lname: profile.lname ?? user.employee.lname,
                    contactno: profile.contactno ?? user.employee.contactno,
                    address: profile.address ?? user.employee.address,
                    bloodtype: profile.bloodtype ?? user.employee.bloodtype,
                    allergies: profile.allergies ?? user.employee.allergies,
                    medical_cond: profile.medical_cond ?? user.employee.medical_cond,
                    emergencyco_name: profile.emergencyco_name ?? user.employee.emergencyco_name,
                    emergencyco_num: profile.emergencyco_num ?? user.employee.emergencyco_num,
                    emergencyco_relation: profile.emergencyco_relation ?? user.employee.emergencyco_relation,
                },
            });
        } else {
            // If not student or employee, just update user metadata
            await prisma.users.update({
                where: { user_id: user.user_id },
                data: {
                    username: profile.username ?? user.username,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/patient/account/me]", err);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
