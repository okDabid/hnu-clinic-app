// src/app/api/auth/reset-password/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizeResetContact } from "@/lib/password-reset";
import { getPasswordStrength } from "@/lib/password-strength";
import {
    assertRateLimit,
    RateLimitError,
    getClientIp,
    applyRateLimitHeaders,
    RateLimitResult,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
    let headerSource: RateLimitResult | null = null;
    try {
        const clientIp = getClientIp(req);
        const ipResult = assertRateLimit({
            key: `auth:reset-verify:ip:${clientIp}`,
            limit: 10,
            windowMs: 10 * 60 * 1000,
            message:
                "Too many password reset attempts from this IP. Please wait before trying again.",
        });
        headerSource = ipResult;

        const { contact, code, newPassword } = await req.json();

        if (typeof contact !== "string" || typeof code !== "string" || typeof newPassword !== "string") {
            const response = NextResponse.json(
                { error: "Missing contact, code, or new password." },
                { status: 400 }
            );
            return applyRateLimitHeaders(response, headerSource);
        }

        const normalized = normalizeResetContact(contact);

        if (!normalized) {
            const response = NextResponse.json(
                { error: "Enter a valid email address." },
                { status: 400 }
            );
            return applyRateLimitHeaders(response, headerSource);
        }

        const sanitizedCode = code.trim();
        const trimmedPassword = newPassword.trim();

        const contactResult = assertRateLimit({
            key: `auth:reset-verify:contact:${normalized.normalized}`,
            limit: 5,
            windowMs: 15 * 60 * 1000,
            message:
                "Too many attempts for this reset code. Please request a new password reset email.",
        });

        if (
            !headerSource ||
            contactResult.remaining < headerSource.remaining ||
            (contactResult.remaining === headerSource.remaining &&
                contactResult.reset < headerSource.reset)
        ) {
            headerSource = contactResult;
        }

        if (!/^\d{6}$/.test(sanitizedCode)) {
            const response = NextResponse.json(
                { error: "Enter the 6-digit verification code." },
                { status: 400 }
            );
            return applyRateLimitHeaders(response, headerSource);
        }

        const strength = getPasswordStrength(trimmedPassword);

        if (strength.label === "Too weak") {
            const response = NextResponse.json(
                { error: "Create a stronger password before continuing." },
                { status: 400 }
            );
            return applyRateLimitHeaders(response, headerSource);
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
            const response = NextResponse.json(
                { error: "Invalid or expired code." },
                { status: 400 }
            );
            return applyRateLimitHeaders(response, headerSource);
        }

        // Get the user from the token's userId
        const user = await prisma.users.findUnique({
            where: { user_id: resetRecord.userId },
        });

        if (!user) {
            const response = NextResponse.json({ error: "Account not found." }, { status: 404 });
            return applyRateLimitHeaders(response, headerSource);
        }

        const passwordMatches = await bcrypt.compare(trimmedPassword, user.password);

        if (passwordMatches) {
            const response = NextResponse.json(
                { error: "New password must be different from the current password." },
                { status: 400 }
            );
            return applyRateLimitHeaders(response, headerSource);
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

        const response = NextResponse.json({
            success: true,
            message: "Password reset successful.",
        });
        return applyRateLimitHeaders(response, headerSource);
    } catch (error) {
        console.error(
            "RESET-PASSWORD ERROR:",
            error instanceof Error ? error.message : error
        );
        if (error instanceof RateLimitError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status, headers: error.headers },
            );
        }
        const response = NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
        return applyRateLimitHeaders(response, headerSource);
    }
}
