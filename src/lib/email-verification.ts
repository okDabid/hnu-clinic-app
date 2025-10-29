import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const EMAIL_VERIFICATION_TOKEN_TYPE = "EMAIL_VERIFICATION";
const VERIFICATION_EXPIRATION_HOURS = 24;

const APP_ORIGIN_ENV_VARS = [
    "EMAIL_VERIFICATION_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_URL_INTERNAL",
    "AUTH_URL",
    "AUTH_ORIGIN",
    "APP_ORIGIN",
    "APP_URL",
    "SITE_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_APP_URL",
];

function stripTrailingSlash(value: string): string {
    return value.replace(/\/$/, "");
}

function ensureProtocol(value: string): string {
    if (!/^https?:\/\//i.test(value)) {
        return `https://${value}`;
    }
    return value;
}

function normalizeBaseUrl(value: string): string {
    return stripTrailingSlash(ensureProtocol(value));
}

function resolveAppBaseUrl(): string {
    for (const envVar of APP_ORIGIN_ENV_VARS) {
        const candidate = process.env[envVar]?.trim();
        if (candidate) {
            return normalizeBaseUrl(candidate);
        }
    }

    const vercelUrl =
        process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ??
        process.env.VERCEL_BRANCH_URL?.trim() ??
        process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ??
        process.env.VERCEL_URL?.trim();
    if (vercelUrl) {
        return normalizeBaseUrl(vercelUrl);
    }

    console.warn(
        "Falling back to http://localhost:3000 for verification links because no base URL environment variables were configured.",
    );

    return "http://localhost:3000";
}

function buildVerificationUrl(token: string): string {
    const baseUrl = resolveAppBaseUrl();
    const encodedToken = encodeURIComponent(token);
    return `${baseUrl}/api/account/email/verify?token=${encodedToken}`;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildHtmlBody(name: string, verificationUrl: string): string {
    const safeName = escapeHtml(name || "Clinic user");
    const safeUrl = escapeHtml(verificationUrl);

    return `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0fdf4; padding: 24px; border-radius: 16px; border: 1px solid #bbf7d0; color: #064e3b;">
            <h2 style="margin-top: 0; color: #047857;">Verify your email address</h2>
            <p>Hello <strong style="color: inherit;">${safeName}</strong>,</p>
            <p>We received a request to add this email address to your Holy Name University Clinic account.</p>
            <p style="margin: 20px 0;">
                <a href="${safeUrl}" style="display: inline-block; background-color: #047857; color: #f0fdf4; padding: 12px 20px; border-radius: 9999px; font-weight: 600; text-decoration: none;">Verify email</a>
            </p>
            <p>If you didn&rsquo;t request this change, you can ignore this email and your clinic profile will stay the same.</p>
            <p style="margin-bottom: 0; color: #047857; font-size: 14px;">This link will expire in ${VERIFICATION_EXPIRATION_HOURS} hours for your security.</p>
        </div>
    `;
}

function buildTextBody(name: string, verificationUrl: string): string {
    const safeName = name || "Clinic user";
    return [
        `Hello ${safeName},`,
        "",
        "We received a request to add this email address to your Holy Name University Clinic account.",
        "Please open the link below to confirm:",
        verificationUrl,
        "",
        `This link will expire in ${VERIFICATION_EXPIRATION_HOURS} hours. If you didn’t request this change, you can ignore this message.`,
    ].join("\n");
}

function normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
}

export async function clearEmailVerifications(userId: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({
        where: { userId, type: EMAIL_VERIFICATION_TOKEN_TYPE },
    });
}

export async function issueEmailVerification(options: {
    userId: string;
    email: string;
    name: string;
}): Promise<void> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRATION_HOURS * 60 * 60 * 1000);
    const normalizedEmail = normalizeEmail(options.email);

    await prisma.passwordResetToken.deleteMany({
        where: { userId: options.userId, type: EMAIL_VERIFICATION_TOKEN_TYPE },
    });

    const record = await prisma.passwordResetToken.create({
        data: {
            userId: options.userId,
            contact: normalizedEmail,
            token,
            expiresAt,
            type: EMAIL_VERIFICATION_TOKEN_TYPE,
            verified: false,
        },
    });

    const verificationUrl = buildVerificationUrl(record.token);
    const html = buildHtmlBody(options.name, verificationUrl);
    const text = buildTextBody(options.name, verificationUrl);

    await sendEmail({
        to: options.email.trim(),
        subject: "Verify your email address",
        html,
        text,
    });
}

export async function isEmailVerified(
    userId: string,
    email: string | null | undefined,
): Promise<boolean> {
    if (!email) return false;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return false;

    const record = await prisma.passwordResetToken.findFirst({
        where: {
            userId,
            type: EMAIL_VERIFICATION_TOKEN_TYPE,
            contact: normalizedEmail,
            verified: true,
        },
        select: { id: true },
    });

    return Boolean(record);
}
