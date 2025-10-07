// src/app/api/auth/reset-password/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { contact, code, newPassword } = await req.json();

        if (!contact || !code || !newPassword) {
            return NextResponse.json(
                { error: "Missing contact, code, or new password." },
                { status: 400 }
            );
        }

        // Find a valid (unexpired) token for this contact + code
        const resetRecord = await prisma.passwordResetToken.findFirst({
            where: {
                contact,
                token: code,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!resetRecord) {
            return NextResponse.json(
                { error: "Invalid or expired code." },
                { status: 400 }
            );
        }

        // Get the user from the token's userId
        const user = await prisma.users.findUnique({
            where: { user_id: resetRecord.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "Account not found." }, { status: 404 });
        }

        // Hash the new password
        const hashed = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.users.update({
            where: { user_id: user.user_id },
            data: { password: hashed },
        });

        // Clean up all tokens for this user (avoid reuse)
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.user_id },
        });

        return NextResponse.json({
            success: true,
            message: "Password reset successful.",
        });
    } catch (error) {
        console.error(
            "RESET-PASSWORD ERROR:",
            error instanceof Error ? error.message : error
        );
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
