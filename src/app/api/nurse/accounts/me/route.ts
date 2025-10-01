import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth"; // if using next-auth
import type { NextRequest } from "next/server";

// ---------------- GET OWN PROFILE ----------------
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(); // 🔐 get logged-in user
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

        let profile: any = null;
        if (user.student) profile = user.student;
        if (user.employee) profile = user.employee;

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
        const session = await getServerSession(); // 🔐 logged-in user
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();
        const { profile } = payload;

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { student: true, employee: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if ((user.role === "PATIENT" || user.role === "SCHOLAR") && user.student) {
            await prisma.student.update({
                where: { user_id: session.user.id },
                data: profile,
            });
        } else if ((user.role === "NURSE" || user.role === "DOCTOR" || user.role === "PATIENT") && user.employee) {
            await prisma.employee.update({
                where: { user_id: session.user.id },
                data: profile,
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/nurse/accounts/me]", err);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
