// src/app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { contact, newPassword } = await req.json();

        if (!contact || !newPassword) {
            return NextResponse.json({ error: "Missing contact or new password." }, { status: 400 });
        }

        // 🔍 Find the user
        const user = await prisma.users.findFirst({
            where: { OR: [{ email: contact }, { phone: contact }] },
        });

        if (!user) {
            return NextResponse.json({ error: "Account not found." }, { status: 404 });
        }

        // 🧂 Hash password
        const hashed = await bcrypt.hash(newPassword, 10);

        // 🧭 Update DB
        await prisma.users.update({
            where: { user_id: user.user_id },
            data: { password: hashed },
        });

        // 🧹 Optional: delete any used tokens
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.user_id },
        });

        return NextResponse.json({ success: true, message: "Password reset successful." });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
