// src/app/api/auth/reset-password/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizeResetContact } from "@/lib/password-reset";
import { getPasswordStrength } from "@/lib/password-strength";

export async function POST(req: Request) {
    try {
        const { contact, code, newPassword } = await req.json();

        if (typeof contact !== "string" || typeof code !== "string" || typeof newPassword !== "string") {
            return NextResponse.json(
                { error: "Missing contact, code, or new password." },
                { status: 400 }
            );
        }

        const normalized = normalizeResetContact(contact);

        if (!normalized) {
            return NextResponse.json(
                { error: "Enter a valid email address." },
                { status: 400 }
            );
        }

        const sanitizedCode = code.trim();
        const trimmedPassword = newPassword.trim();

        if (!/^\d{6}$/.test(sanitizedCode)) {
            return NextResponse.json(
                { error: "Enter the 6-digit verification code." },
                { status: 400 }
            );
        }

        const strength = getPasswordStrength(trimmedPassword);

        if (strength.label === "Too weak") {
            return NextResponse.json(
                { error: "Create a stronger password before continuing." },
                { status: 400 }
            );
        }

        // Find a valid (unexpired) token for this contact + code
        const resetRecord = await prisma.passwordResetToken.findFirst({
            where: {
                contact: normalized.normalized,
                token: sanitizedCode,
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

        const passwordMatches = await bcrypt.compare(trimmedPassword, user.password);

        if (passwordMatches) {
            return NextResponse.json(
                { error: "New password must be different from the current password." },
                { status: 400 }
            );
        }

        // Hash the new password
        const hashed = await bcrypt.hash(trimmedPassword, 10);

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
