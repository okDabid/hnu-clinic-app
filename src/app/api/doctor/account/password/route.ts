import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// ---------------- UPDATE PASSWORD ----------------
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { oldPassword, newPassword } = await req.json();

        if (!oldPassword || !newPassword) {
            return NextResponse.json(
                { error: "Old and new password are required" },
                { status: 400 }
            );
        }

        // 🔹 Fetch doctor user
        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Forbidden: Not a doctor" }, { status: 403 });
        }

        // 🔹 Check old password
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }

        // 🔹 Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.users.update({
            where: { user_id: user.user_id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/doctor/account/password]", err);
        return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }
}
