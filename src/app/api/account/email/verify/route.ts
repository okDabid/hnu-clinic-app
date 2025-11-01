import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { EMAIL_VERIFICATION_TOKEN_TYPE } from "@/lib/email-verification";
import { ipKey, withRateLimit } from "@/lib/rate-limit";
import type { RateLimitedRequest } from "@/lib/rate-limit";

function htmlResponse(title: string, message: string, success: boolean) {
    const color = success ? "#047857" : "#b91c1c";
    const background = success ? "#ecfdf5" : "#fef2f2";
    const border = success ? "#a7f3d0" : "#fecaca";

    const body = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <title>${title}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px;">
                <main style="max-width: 520px; margin: 40px auto; background: white; border-radius: 18px; padding: 32px; border: 1px solid #e5e7eb; box-shadow: 0 20px 40px rgba(15, 118, 110, 0.08);">
                    <div style="background-color: ${background}; border: 1px solid ${border}; border-radius: 14px; padding: 24px;">
                        <h1 style="margin-top: 0; color: ${color}; font-size: 24px;">${title}</h1>
                        <p style="color: #1f2937; font-size: 15px; line-height: 1.6;">${message}</p>
                    </div>
                    <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
                        Holy Name University Clinic Portal
                    </p>
                </main>
            </body>
        </html>
    `;

    return new Response(body, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}

async function getHandler(request: RateLimitedRequest) {
    const nextRequest = request as NextRequest;
    const token = nextRequest.nextUrl.searchParams.get("token");

    if (!token) {
        return htmlResponse(
            "Missing verification token",
            "We couldn’t find a verification token in your request. Please use the latest link sent to your email.",
            false
        );
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.type !== EMAIL_VERIFICATION_TOKEN_TYPE) {
        return htmlResponse(
            "Verification link not found",
            "The verification link is invalid or has already been used. If you still need to verify your email, request a new link from your clinic profile settings.",
            false
        );
    }

    if (record.expiresAt.getTime() < Date.now() && !record.verified) {
        await prisma.passwordResetToken.delete({ where: { id: record.id } });
        return htmlResponse(
            "Verification link expired",
            "This verification link has expired. Please submit a new email verification request from your clinic profile.",
            false
        );
    }

    const user = await prisma.users.findUnique({
        where: { user_id: record.userId },
        select: {
            user_id: true,
            role: true,
            student: { select: { email: true } },
            employee: { select: { email: true } },
        },
    });

    if (!user) {
        await prisma.passwordResetToken.delete({ where: { id: record.id } });
        return htmlResponse(
            "Account not found",
            "We couldn’t locate the account for this verification link. Please contact the clinic if this issue continues.",
            false
        );
    }

    const currentEmail = (user.student?.email ?? user.employee?.email ?? "").trim();
    if (!currentEmail || currentEmail.toLowerCase() !== record.contact.toLowerCase()) {
        await prisma.passwordResetToken.delete({ where: { id: record.id } });
        return htmlResponse(
            "Email changed before verification",
            "It looks like the email on this account was updated after this link was sent. Please use the most recent verification email to confirm your address.",
            false
        );
    }

    await prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { verified: true },
    });

    await prisma.passwordResetToken.deleteMany({
        where: {
            userId: user.user_id,
            type: EMAIL_VERIFICATION_TOKEN_TYPE,
            NOT: { id: record.id },
        },
    });

    return htmlResponse(
        "Email verified",
        "Thank you! Your email address has been confirmed and clinic notifications will now be sent to this inbox.",
        true
    );
}

export const GET = withRateLimit(
    {
        key: ipKey("account:email-verify:ip"),
        limit: 10,
        windowMs: 5 * 60_000,
        message: "Too many verification attempts from this IP. Please wait before trying again.",
    },
    getHandler
);
