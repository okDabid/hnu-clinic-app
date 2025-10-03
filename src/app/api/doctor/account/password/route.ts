import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { oldPassword, newPassword } = await req.json();

        if (!oldPassword || !newPassword) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // 🔎 Fetch doctor account
        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 🔐 Validate current password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
        }

        // 🔑 Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // ✅ Update doctor’s password
        await prisma.users.update({
            where: { user_id: user.user_id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/doctor/account/password] ERROR:", err);
        return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }
}
